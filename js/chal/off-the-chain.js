// js/chal/off-the-chain.js — That's Off the Chain! bike race challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── BIKE NAME TEMPLATES ──
// Personality-based cosmetic names for bikes
const BIKE_NAMES = {
  'villain':          ['The Backstabber', 'Dark Ride', 'Venom Wheels'],
  'mastermind':       ['The Masterstroke', 'Chess Piece', 'Shadow Cruiser'],
  'schemer':          ['The Double Cross', 'Sneak Cycle', 'Plot Twist'],
  'hothead':          ['Rage Machine', 'The Burnout', 'Fury Rider'],
  'challenge-beast':  ['The Dominator', 'Beast Mode', 'Iron Horse'],
  'social-butterfly': ['Sunshine Cruiser', 'The Charmer', 'Social Cycle'],
  'loyal-soldier':    ['Old Faithful', 'The Steady', 'Shield Rider'],
  'wildcard':         ['The ???', 'Chaos Wheels', 'Mystery Machine'],
  'chaos-agent':      ['The Wrecking Ball', 'Anarchy Bike', 'Boom Cycle'],
  'floater':          ['The Drifter', 'Coast-Along', 'Breeze Rider'],
  'underdog':         ['Little Engine', 'The Scrapper', 'Long Shot'],
  'hero':             ['Justice Rider', 'The Guardian', 'Hero Cycle'],
  'goat':             ['The Wobbler', 'Hot Mess Express', 'Duct Tape Dream'],
  'perceptive-player':['The Observer', 'Eagle Eye', 'Sixth Sense Cycle'],
  'showmancer':       ['The Heartbreaker', 'Love Ride', 'Cupid Cruiser'],
};

// ── BUILD EVENT POOL ──
const BUILD_EVENTS = [
  { id:'sabotage',     weight:0.8, villainsOnly:true },
  { id:'help',         weight:0.7, niceOnly:true },
  { id:'parts-theft',  weight:0.5, villainsOnly:true },
  { id:'showmance-distract', weight:0.6 },
  { id:'manual-drama', weight:0.7 },
  { id:'wildcard-speed', weight:0.4 },
];

// ── PART 1 RACE EVENT POOL ──
const RACE1_EVENTS = [
  { id:'near-crash',    weight:0.8 },
  { id:'drafting',      weight:0.6 },
  { id:'handlebar-wobble', weight:0.7 },
  { id:'unfamiliar-quirks', weight:0.6 },
  { id:'bike-falls-apart', weight:0.3 },
  { id:'trash-talk',    weight:0.5 },
];

// ── PART 2 OBSTACLE EVENT POOL ──
const OBSTACLE_EVENTS = [
  { id:'close-call',     weight:0.8 },
  { id:'showmance-cheer', weight:0.4 },
  { id:'rivalry-push',   weight:0.5 },
  { id:'bike-smoking',   weight:0.7 },
  { id:'clutch-save',    weight:0.5 },
  { id:'spectacular-wipeout', weight:0.4 },
];

// ── PER-RIDER OBSTACLE NARRATIVE BEATS ──
const MINE_BEATS = {
  clean: [
    (p, pr) => `${p} weaved through the minefield like a pro — not a scratch!`,
    (p, pr) => `${p} read the terrain perfectly, dodging every mine.`,
    (p, pr) => `${pr.Sub} zigzagged through the mines without breaking a sweat.`,
  ],
  clipped: [
    (p, pr) => `${p} clipped a mine — BANG! The bike rattled but held together.`,
    (p, pr) => `A mine detonated near ${pr.posAdj} back wheel — ${p} swerved but took a hit.`,
    (p, pr) => `${p} didn't see that last mine. The explosion rocked ${pr.posAdj} bike.`,
    (p, pr) => `Shrapnel from a mine pinged off ${pr.posAdj} frame!`,
  ],
  hit: [
    (p, pr) => `${p} rode STRAIGHT into a cluster of mines! BOOM BOOM BOOM!`,
    (p, pr) => `Multiple mines went off under ${p}. The bike is smoking badly.`,
    (p, pr) => `${p} couldn't see the mines through the dust — hit THREE of them.`,
  ],
};

const OIL_BEATS = {
  'power-through': [
    (p, pr) => `${p} powered right through the oil slick — sheer momentum!`,
    (p, pr) => `${pr.Sub} barely noticed the oil. Just plowed through.`,
    (p, pr) => `${p} leaned into the slick and kept ${pr.posAdj} balance perfectly.`,
  ],
  fishtail: [
    (p, pr) => `${p}'s back wheel kicked out on the oil — ${pr.sub} fishtailed wildly before recovering!`,
    (p, pr) => `${p} hit the oil and the bike went sideways! ${pr.Sub} barely pulled it back.`,
    (p, pr) => `The oil slick sent ${p} sliding — ${pr.sub} dragged a foot to stabilize.`,
    (p, pr) => `${p} skidded across the oil, leaving a long streak. The bike groaned.`,
  ],
  wipeout: [
    (p, pr) => `${p} hit the oil and went FLYING. Bike and rider separated mid-air!`,
    (p, pr) => `WIPEOUT! ${p} slid across the oil slick face-first.`,
    (p, pr) => `${p}'s tires lost all grip — the bike spun out completely!`,
  ],
};

const PIRANHA_BEATS = {
  clear: [
    (p, pr) => `${p} hit the ramp and LAUNCHED over the piranha pool — perfect landing!`,
    (p, pr) => `${pr.Sub} cleared the piranhas with room to spare. The crowd went wild.`,
    (p, pr) => `${p} flew over the snapping piranhas and stuck the landing!`,
  ],
  'hard-landing': [
    (p, pr) => `${p} cleared the pool but landed HARD — the bike buckled under the impact.`,
    (p, pr) => `${pr.Sub} barely made it across! The back wheel dipped into the water.`,
    (p, pr) => `${p} cleared the piranhas but the landing cracked something in the frame.`,
    (p, pr) => `The jump was ugly but ${p} made it — piranhas snapping at ${pr.posAdj} tires.`,
  ],
  'piranha-splash': [
    (p, pr) => `${p} didn't get enough speed — SPLASH! Right into the piranha pool!`,
    (p, pr) => `The bike couldn't clear the jump. ${p} and the bike plunged into piranha-infested water!`,
    (p, pr) => `NOT ENOUGH AIR! ${p} belly-flopped into the piranha pool!`,
  ],
};

// ── INTER-RIDER OBSTACLE EVENTS (fire between riders in same obstacle) ──
const OBSTACLE_INTER_EVENTS = [
  { id:'neck-and-neck', text: (a, b) => `${a} and ${b} are neck and neck through the obstacle!` },
  { id:'bike-smoking', text: (p, pr) => `${p}'s bike is trailing thick black smoke — it won't last much longer!` },
  { id:'crowd-gasp', text: (p, pr) => `The spectators gasped as ${p}'s bike almost gave out mid-obstacle!` },
  { id:'showmance-cheer', text: (p, partner) => `${partner} screamed from the sidelines: "COME ON ${p.toUpperCase()}!"` },
  { id:'rivalry-edge', text: (a, b) => `${a} tried to edge ${b} toward the danger zone!` },
  { id:'chris-play', text: (p, pr) => `"Oh this is gonna be CLOSE!" Chris leaned forward on his ATV.` },
  { id:'chef-reaction', text: (p, pr) => `Chef Hatchet winced. "That's gonna leave a mark."` },
  { id:'close-call', text: (p, pr) => `${p} dodged by INCHES — ${pr.posAdj} heart was pounding!` },
  { id:'momentum', text: (p, pr) => `${p} built up speed and blasted through with pure momentum!` },
  { id:'wobble', text: (p, pr) => `${p}'s handlebars started shaking — the damage is catching up!` },
];

// ── CHRIS COMMENTARY ──
const CHRIS_BIKE_QUIPS = {
  buildJudge: [
    `"Excellent aerodynamics!" — Chris McLean`,
    `"Spooky, yet practical. Well done." — Chris McLean`,
    `"Wicked Mad Max mobile, dude!" — Chris McLean`,
    `"Dude, seriously? This is lame." — Chris McLean`,
    `"I call that 'abstract'... and by abstract I mean terrible." — Chris McLean`,
    `"Not bad! I mean, it'll probably kill you, but not bad!" — Chris McLean`,
  ],
  buildJudgeBad: [
    `"Is... is that even a bike?" — Chris McLean`,
    `"I've seen better engineering from a toddler with Legos." — Chris McLean`,
    `"Wow. Just... wow." — Chris McLean`,
  ],
  buildJudgeGood: [
    `"Now THAT is a machine!" — Chris McLean`,
    `"Chef's gonna be jealous of this one." — Chris McLean`,
    `"Somebody actually read the manual!" — Chris McLean`,
  ],
  swapReveal: [
    `"Oh, this is gonna be GOOD." — Chris McLean`,
    `"I love this part. The look on their faces!" — Chris McLean`,
    `"Surprise! You're not riding your own bike!" — Chris McLean`,
  ],
  race1Start: [
    `"Riders, start your... well, someone else's engines!" — Chris McLean`,
    `"Remember, if the bike breaks, blame the builder!" — Chris McLean`,
  ],
  race1Finish: [
    `"And they cross the line!" — Chris McLean`,
    `"That bike made it! Barely." — Chris McLean`,
  ],
  race1Fail: [
    `"And that's a DNF! Tough break for the builder." — Chris McLean`,
    `"Ooh, not gonna make it." — Chris McLean`,
  ],
  obstacleStart: [
    `"Land mines, oil slicks, and piranhas. Good luck!" — Chris McLean`,
    `"This is the part where things get REALLY interesting." — Chris McLean`,
  ],
  bikeDestroyed: [
    `"And BOOM goes the bike!" — Chris McLean`,
    `"That's... not gonna buff out." — Chris McLean`,
    `"Well, on the bright side, you can't finish last if you don't finish at all!" — Chris McLean`,
  ],
  immunityWin: [
    `"First across the line! Invincibility is YOURS!" — Chris McLean`,
    `"Winner winner! You're safe tonight!" — Chris McLean`,
  ],
  lastPlace: [
    `"And that means... you're out. Sorry, not sorry." — Chris McLean`,
    `"Last place. The Dock of Shame awaits." — Chris McLean`,
  ],
};

// ── ELIMINATION REACTION TEMPLATES ──
const REACTION_TEMPLATES = {
  betrayalCallout: [
    (victim, saboteur) => `${victim} whipped around: "YOU sabotaged my bike!"`,
    (victim, saboteur) => `${victim} pointed straight at ${saboteur}: "I KNOW what you did!"`,
  ],
  betrayerSmirk: [
    (sab, pr) => `${sab} just shrugged. "Prove it."`,
    (sab, pr) => `${sab} smirked. "It's a competition, not a friendship circle."`,
  ],
  betrayerGuilty: [
    (sab, pr) => `${sab} looked away, guilt written all over ${pr.posAdj} face.`,
    (sab, pr) => `${sab}'s eyes dropped. "I... I'm sorry. I had to."`,
  ],
  bffExplosion: [
    (victim, betrayer) => `${victim}'s voice cracked: "I thought we were FRIENDS!"`,
    (victim, betrayer) => `${victim} stared at ${betrayer} in disbelief. "After everything?!"`,
  ],
  bffCallout: [
    (victim, betrayer) => `"You used me! This WHOLE time!" ${victim}'s hands were shaking.`,
    (victim, betrayer) => `${victim} got right in ${betrayer}'s face. The other campers backed up.`,
  ],
  crowdCheer: [
    (victim) => `The other campers erupted. Someone started a slow clap for ${victim}.`,
    (victim) => `"YEAH!" Leshawna pumped her fist. The whole camp rallied behind ${victim}.`,
  ],
  showmanceGoodbye: [
    (victim, partner, pr) => `${partner} grabbed ${victim}'s hand. "I'll win this for both of us."`,
    (victim, partner, pr) => `${victim} pulled ${partner} into a hug. Neither wanted to let go.`,
  ],
  gracefulExit: [
    (victim) => `${victim} took a breath. "It's been real, guys."`,
    (victim) => `${victim} waved to everyone. "No hard feelings. Mostly."`,
  ],
  wrongNames: [
    (victim, target, wrongName) => `${victim} hugged ${target}: "I'll miss you, ${wrongName}!"`,
  ],
};

// ── HELPERS ──
const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }
function neutralWouldScheme(name) { const s = pStats(name); return s.strategic >= 6 && s.loyalty <= 4; }

function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

function wPick(arr) {
  const total = arr.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of arr) { r -= (item.weight || 1); if (r <= 0) return item; }
  return arr[arr.length - 1];
}

function calcBikeQuality(name) {
  const s = pStats(name);
  const arch = getArchetype(name);
  let q = s.mental * 0.3 + s.physical * 0.25 + s.intuition * 0.2 + s.strategic * 0.15 + s.boldness * 0.1;
  q = (q - 5.0) * 1.2 + 5.0; // gentle spread: stats 3→2.6, stats 5→5, stats 7→7.4
  // Archetype bonuses (smaller so top doesn't cluster at cap)
  if (arch === 'challenge-beast') q += 1.0;
  else if (arch === 'mastermind' || arch === 'schemer') q += 0.8;
  else if (arch === 'hothead') q -= 1.0;
  else if (arch === 'goat') q -= 1.5;
  else if (arch === 'wildcard' || arch === 'chaos-agent') q += (Math.random() * 3) - 1.5;
  else if (arch === 'underdog') q += 0.3;
  else if (arch === 'floater') q += 0.2;
  else if (arch === 'perceptive-player') q += 0.4;
  else if (arch === 'social-butterfly') q -= 0.5;
  else if (arch === 'showmancer') {
    const inShowmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players.includes(name));
    if (inShowmance) q -= 0.5;
  }
  q += (Math.random() * 2.5) - 1.25; // tighter noise
  return Math.max(1, Math.min(9.5, q)); // cap at 9.5, not 10
}

const _usedBikeNames = new Set();
function getBikeName(name) {
  const arch = getArchetype(name) || 'floater';
  const pool = (BIKE_NAMES[arch] || BIKE_NAMES['floater']).filter(n => !_usedBikeNames.has(n));
  const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : `${name}'s Ride`;
  _usedBikeNames.add(pick);
  return pick;
}

// Generate a derangement (no one gets their own bike)
function derangement(arr) {
  for (let attempts = 0; attempts < 100; attempts++) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    if (shuffled.every((v, i) => v !== arr[i])) return shuffled;
  }
  // Fallback: swap first two if stuck
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  if (shuffled[0] === arr[0]) { const tmp = shuffled[0]; shuffled[0] = shuffled[1]; shuffled[1] = tmp; }
  return shuffled;
}

// ══════════════════════════════════════════════════════════════
// SIMULATE
// ══════════════════════════════════════════════════════════════
export function simulateOffTheChain(ep) {
  const activePlayers = [...gs.activePlayers];
  const n = activePlayers.length;
  const badges = {};
  const chrisQuips = {};

  // ══ PHASE 1: BUILD ══
  const bikeQuality = {};   // { name: number 1-10 }
  const bikeHP = {};        // { name: number }
  const bikeNames = {};     // { name: string }
  const buildEvents = [];   // [{ id, players, text, effect }]

  // Build bikes
  activePlayers.forEach(name => {
    bikeQuality[name] = calcBikeQuality(name);
    bikeNames[name] = getBikeName(name);
  });

  // Build events (2-3)
  const buildEventCount = 2 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < buildEventCount; i++) {
    // Pick event type
    const eligible = BUILD_EVENTS.filter(e => {
      if (e.villainsOnly && !activePlayers.some(p => isVillainArch(p) || neutralWouldScheme(p))) return false;
      if (e.niceOnly && !activePlayers.some(p => isNiceArch(p))) return false;
      if (e.id === 'showmance-distract' && !(gs.showmances || []).some(s => s.phase !== 'broken-up' && s.players.some(p => activePlayers.includes(p)))) return false;
      if (e.id === 'wildcard-speed' && !activePlayers.some(p => ['wildcard', 'chaos-agent'].includes(getArchetype(p)))) return false;
      return true;
    });
    if (!eligible.length) continue;
    const template = wPick(eligible);
    const evt = { id: template.id, players: [], text: '', effect: {} };

    if (template.id === 'sabotage') {
      const saboteurs = activePlayers.filter(p => isVillainArch(p) || neutralWouldScheme(p));
      if (!saboteurs.length) continue;
      const saboteur = saboteurs[Math.floor(Math.random() * saboteurs.length)];
      const targets = activePlayers.filter(p => p !== saboteur);
      const target = [...targets].sort((a, b) => getBond(saboteur, a) - getBond(saboteur, b))[0]; // lowest bond
      const s = pStats(saboteur);
      const sabotageStrength = s.strategic * 0.4 + s.mental * 0.3 + (Math.random() - 0.5);
      let penalty = 1.5 + sabotageStrength * 0.15;
      penalty = Math.min(2.5, Math.max(1.5, penalty));
      // Detection check
      const detector = activePlayers.find(p => p !== saboteur && p !== target && pStats(p).intuition * 0.4 + Math.random() > 6);
      const targetDetects = pStats(target).intuition * 0.4 + Math.random() > 6;
      let detected = false;
      if (detector || targetDetects) {
        detected = true;
        penalty = 0.5; // partially undone
        addBond(saboteur, target, -2);
        popDelta(saboteur, -1);
        const detectPr = pronouns(detector || target);
        evt.text = `${saboteur} tried to sabotage ${target}'s bike — but ${detector || target} caught ${pronouns(saboteur).obj} in the act! Damage partially undone.`;
      } else {
        addBond(saboteur, target, -2);
        evt.text = `${saboteur} loosened the bolts on ${target}'s bike when no one was looking. The damage is hidden... for now.`;
      }
      bikeQuality[target] -= penalty;
      bikeQuality[target] = Math.max(1, bikeQuality[target]);
      evt.players = [saboteur, target];
      evt.effect = { saboteur, target, penalty, detected };
      if (!detected) badges[saboteur] = 'bikeRaceSaboteur';
    } else if (template.id === 'help') {
      const helpers = activePlayers.filter(p => isNiceArch(p));
      if (!helpers.length) continue;
      const helper = helpers[Math.floor(Math.random() * helpers.length)];
      const weakest = activePlayers.filter(p => p !== helper).sort((a, b) => bikeQuality[a] - bikeQuality[b])[0];
      const bonus = 1.0 + Math.random() * 0.5;
      bikeQuality[weakest] += bonus;
      bikeQuality[weakest] = Math.min(10, bikeQuality[weakest]);
      addBond(helper, weakest, 2);
      const hPr = pronouns(helper);
      evt.text = `${helper} noticed ${weakest} struggling and helped ${pronouns(weakest).obj} fix the frame. ${hPr.Sub} even shared some spare parts.`;
      evt.players = [helper, weakest];
      evt.effect = { helper, target: weakest, bonus };
    } else if (template.id === 'parts-theft') {
      const thieves = activePlayers.filter(p => isVillainArch(p) || neutralWouldScheme(p));
      if (!thieves.length) continue;
      const thief = thieves[Math.floor(Math.random() * thieves.length)];
      const victim = activePlayers.filter(p => p !== thief)[Math.floor(Math.random() * (activePlayers.length - 1))];
      bikeQuality[thief] += 0.5;
      bikeQuality[victim] -= 0.5;
      evt.text = `${thief} snagged the best parts from the depot before ${victim} could get to them.`;
      evt.players = [thief, victim];
      evt.effect = { thief, victim };
    } else if (template.id === 'showmance-distract') {
      const sh = (gs.showmances || []).find(s => s.phase !== 'broken-up' && s.players.some(p => activePlayers.includes(p)));
      if (!sh) continue;
      const distracted = sh.players.find(p => activePlayers.includes(p));
      if (!distracted) continue;
      bikeQuality[distracted] -= 0.5;
      const partner = sh.players.find(p => p !== distracted);
      evt.text = `${partner || 'Their partner'} kept visiting ${distracted}'s workstation. Sweet, but distracting.`;
      evt.players = [distracted];
      evt.effect = { distracted, penalty: 0.5 };
    } else if (template.id === 'manual-drama') {
      const reader = activePlayers[Math.floor(Math.random() * n)];
      const s = pStats(reader);
      const success = s.mental + Math.random() * 2 > 6;
      if (success) {
        bikeQuality[reader] += 1.0;
        evt.text = `${reader} found the moldy bike manual and actually deciphered it. Bike quality improved!`;
      } else {
        evt.text = `${reader} tried to read the moldy bike manual but couldn't make sense of it. Wasted time.`;
      }
      evt.players = [reader];
      evt.effect = { reader, success, bonus: success ? 1.0 : 0 };
    } else if (template.id === 'wildcard-speed') {
      const wc = activePlayers.find(p => ['wildcard', 'chaos-agent'].includes(getArchetype(p)));
      if (!wc) continue;
      const extraNoise = (Math.random() * 4) - 2.0;
      bikeQuality[wc] += extraNoise;
      bikeQuality[wc] = Math.max(1, Math.min(10, bikeQuality[wc]));
      const wcPr = pronouns(wc);
      evt.text = extraNoise > 0
        ? `${wc} finished ${wcPr.posAdj} bike in record time — and somehow it actually looks... good?!`
        : `${wc} "finished" ${wcPr.posAdj} bike in five minutes flat. It looks like modern art. Broken modern art.`;
      evt.players = [wc];
      evt.effect = { player: wc, delta: extraNoise };
    }
    buildEvents.push(evt);
  }

  // Compute bike HP from final quality
  activePlayers.forEach(name => {
    bikeHP[name] = Math.round(bikeQuality[name] * 10);
  });

  // Chris judging quips
  const bestBuilder = activePlayers.reduce((best, p) => bikeQuality[p] > bikeQuality[best] ? p : best, activePlayers[0]);
  const worstBuilder = activePlayers.reduce((worst, p) => bikeQuality[p] < bikeQuality[worst] ? p : worst, activePlayers[0]);
  badges[bestBuilder] = 'bikeRaceBuilder';
  popDelta(bestBuilder, 1);
  popDelta(worstBuilder, -1);

  activePlayers.forEach(name => {
    const q = bikeQuality[name];
    const pool = q >= 7 ? CHRIS_BIKE_QUIPS.buildJudgeGood : q <= 3 ? CHRIS_BIKE_QUIPS.buildJudgeBad : CHRIS_BIKE_QUIPS.buildJudge;
    chrisQuips[`judge-${name}`] = pool[Math.floor(Math.random() * pool.length)];
  });

  const phase1 = { bikeQuality: { ...bikeQuality }, bikeHP: { ...bikeHP }, bikeNames: { ...bikeNames }, buildEvents, bestBuilder, worstBuilder };

  // ══ PHASE 2: SWAP + PART 1 RACE ══
  // Derangement: no one rides their own bike
  const riderOrder = [...activePlayers];
  const bikeOwnerOrder = derangement(riderOrder);
  const riderAssignments = {}; // { rider: bikeOwner }
  riderOrder.forEach((rider, i) => { riderAssignments[rider] = bikeOwnerOrder[i]; });

  chrisQuips['swap'] = CHRIS_BIKE_QUIPS.swapReveal[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.swapReveal.length)];

  // Part 1: Race on someone else's bike
  const race1Scores = {};
  const race1Events = [];

  activePlayers.forEach(rider => {
    const bikeOwner = riderAssignments[rider];
    const bq = bikeQuality[bikeOwner];
    const s = pStats(rider);
    race1Scores[rider] = s.physical * 0.3 + s.endurance * 0.25 + s.boldness * 0.2 + bq * 0.25 + (Math.random() * 4 - 2);
  });

  // Race 1 events (2-3)
  const race1EventCount = 2 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < race1EventCount; i++) {
    const template = wPick(RACE1_EVENTS);
    const evt = { id: template.id, players: [], text: '' };
    const riders = [...activePlayers].sort((a, b) => race1Scores[a] - race1Scores[b]); // worst to best

    if (template.id === 'near-crash') {
      const rider = riders[0]; // worst rider
      const rPr = pronouns(rider);
      const bikeOwner = riderAssignments[rider];
      race1Scores[rider] -= 0.5;
      evt.text = `${rider} nearly crashed on ${bikeOwner}'s bike — ${rPr.sub} barely kept control!`;
      evt.players = [rider];
    } else if (template.id === 'drafting') {
      if (riders.length < 2) continue;
      const leader = riders[riders.length - 1];
      const follower = riders[riders.length - 2];
      race1Scores[follower] += 0.5;
      evt.text = `${follower} drafted behind ${leader}, picking up speed!`;
      evt.players = [follower, leader];
    } else if (template.id === 'handlebar-wobble') {
      // Target rider on a low-quality bike
      const riderOnBadBike = riders.find(r => bikeQuality[riderAssignments[r]] <= 4);
      if (!riderOnBadBike) continue;
      const bikeOwner = riderAssignments[riderOnBadBike];
      race1Scores[riderOnBadBike] -= 1.0;
      evt.text = `${riderOnBadBike}'s handlebars started wobbling on ${bikeOwner}'s poorly-built bike!`;
      evt.players = [riderOnBadBike];
    } else if (template.id === 'unfamiliar-quirks') {
      const rider = riders[Math.floor(Math.random() * riders.length)];
      const bikeOwner = riderAssignments[rider];
      const builderBoldness = pStats(bikeOwner).boldness;
      const penalty = builderBoldness >= 7 ? -1.0 : -0.5; // weirder bike = more confusing
      race1Scores[rider] += penalty;
      evt.text = `${rider} couldn't figure out ${bikeOwner}'s unconventional bike design — what even IS that gear shift?`;
      evt.players = [rider];
    } else if (template.id === 'bike-falls-apart') {
      const riderOnJunk = riders.find(r => bikeQuality[riderAssignments[r]] <= 3);
      if (!riderOnJunk) continue;
      const bikeOwner = riderAssignments[riderOnJunk];
      race1Scores[riderOnJunk] -= 2.0;
      bikeHP[bikeOwner] -= 20;
      evt.text = `The wheel flew right off ${bikeOwner}'s bike! ${riderOnJunk} went tumbling!`;
      evt.players = [riderOnJunk, bikeOwner];
    } else if (template.id === 'trash-talk') {
      if (riders.length < 2) continue;
      const pair = [...riders].sort(() => Math.random() - 0.5).slice(0, 2);
      const [a, b] = pair;
      if (getBond(a, b) > 2) continue; // friends don't trash talk
      addBond(a, b, -1);
      const winner = race1Scores[a] > race1Scores[b] ? a : b;
      race1Scores[winner] += 0.5;
      evt.text = `${a} and ${b} traded insults mid-race. ${winner} channeled the anger into speed!`;
      evt.players = [a, b];
    }
    if (evt.text) race1Events.push(evt);
  }

  // Determine who crosses the finish line — gap detection
  const sortedRiders = [...activePlayers].sort((a, b) => race1Scores[b] - race1Scores[a]);
  let cutIndex = Math.ceil(n * 0.5); // default: top 50%
  // Find biggest gap in middle 40-70% range
  let biggestGap = 0, gapIdx = cutIndex;
  for (let i = Math.floor(n * 0.3); i < Math.ceil(n * 0.7); i++) {
    if (i >= sortedRiders.length - 1) break;
    const gap = race1Scores[sortedRiders[i]] - race1Scores[sortedRiders[i + 1]];
    if (gap > biggestGap) { biggestGap = gap; gapIdx = i + 1; }
  }
  cutIndex = Math.max(3, Math.min(n - 2, gapIdx)); // min 3 advance, max n-2

  const finishers = sortedRiders.slice(0, cutIndex); // riders who crossed
  const failures = sortedRiders.slice(cutIndex); // riders who didn't

  // Map back to bike owners who advance to Part 2
  const advancingOwners = finishers.map(rider => riderAssignments[rider]);
  const eliminatedOwners = failures.map(rider => riderAssignments[rider]);

  // Part 1 wear damage on surviving bikes
  finishers.forEach(rider => {
    const owner = riderAssignments[rider];
    const wear = Math.max(0, Math.min(15, (10 - race1Scores[rider]) * 1.5));
    bikeHP[owner] = Math.max(10, bikeHP[owner] - Math.round(wear));
  });

  // Popularity: good bike = +1, bad bike = -1
  advancingOwners.forEach(owner => { if (bikeQuality[owner] >= 7) popDelta(owner, 1); });
  eliminatedOwners.forEach(owner => { popDelta(owner, -1); });

  // Chris quips for finishers/failures
  finishers.forEach(r => { chrisQuips[`race1-${r}`] = CHRIS_BIKE_QUIPS.race1Finish[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.race1Finish.length)]; });
  failures.forEach(r => { chrisQuips[`race1-${r}`] = CHRIS_BIKE_QUIPS.race1Fail[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.race1Fail.length)]; });

  const phase2 = {
    riderAssignments, race1Scores, race1Events,
    sortedRiders, cutIndex, finishers, failures,
    advancingOwners, eliminatedOwners,
  };

  // ══ PHASE 3: PART 2 — OBSTACLE GAUNTLET ══
  const racers = [...advancingOwners]; // these players ride their own bikes
  const familiarityBonus = 1.5;
  const obstacleResults = {}; // { playerName: { mines:{}, oil:{}, piranhas:{}, destroyed:bool, finishTime:number } }
  const destroyed = []; // players whose bikes were destroyed
  const obstacleEvents = []; // per-obstacle events
  let stillRacing = [...racers];

  chrisQuips['obstacle-start'] = CHRIS_BIKE_QUIPS.obstacleStart[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.obstacleStart.length)];

  racers.forEach(name => {
    obstacleResults[name] = { obstacles: [], destroyed: false, totalPenalty: 0, bikeHPStart: bikeHP[name] };
  });

  // --- Obstacle 1: Land Mines ---
  const mineEvents = [];
  stillRacing.forEach(name => {
    const s = pStats(name);
    const hpFactor = bikeHP[name] / 100;
    const score = s.intuition * 0.35 + s.boldness * 0.25 + hpFactor * 0.2 + (Math.random() * 4 - 2) + familiarityBonus;
    let damage = 0, timePenalty = 0, outcome = '';
    if (score >= 7) { damage = 0; timePenalty = 0; outcome = 'clean'; }
    else if (score >= 4) { damage = 5 + Math.floor(Math.random() * 8); timePenalty = 1; outcome = 'clipped'; }
    else { damage = 12 + Math.floor(Math.random() * 10); timePenalty = 3; outcome = 'hit'; }
    bikeHP[name] -= damage;
    const mineDestroyed = bikeHP[name] <= 0 || (bikeHP[name] < 15 && Math.random() < 0.3);
    if (mineDestroyed) bikeHP[name] = 0;
    const mineBeats = MINE_BEATS[outcome] || MINE_BEATS.clipped;
    const mineBeatText = mineBeats[Math.floor(Math.random() * mineBeats.length)](name, pronouns(name));
    obstacleResults[name].obstacles.push({ id: 'mines', score, damage, timePenalty, outcome, hpAfter: bikeHP[name], destroyed: mineDestroyed, beats: [mineBeatText] });
    obstacleResults[name].totalPenalty += timePenalty;
    if (mineDestroyed) {
      bikeHP[name] = 0;
      obstacleResults[name].destroyed = true;
      destroyed.push(name);
      badges[name] = 'bikeRaceWreck';
      popDelta(name, -1);
      chrisQuips[`destroyed-${name}`] = CHRIS_BIKE_QUIPS.bikeDestroyed[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.bikeDestroyed.length)];
    }
  });
  stillRacing = stillRacing.filter(p => !destroyed.includes(p));

  // Inter-events for mines
  {
    const interCount = 2 + (Math.random() < 0.4 ? 1 : 0);
    for (let ie = 0; ie < interCount && stillRacing.length >= 1; ie++) {
      const pick = OBSTACLE_INTER_EVENTS[Math.floor(Math.random() * OBSTACLE_INTER_EVENTS.length)];
      const rp = stillRacing[Math.floor(Math.random() * stillRacing.length)];
      const pr = pronouns(rp);
      let evtText = '';
      if ((pick.id === 'neck-and-neck' || pick.id === 'rivalry-edge') && stillRacing.length >= 2) {
        const other = stillRacing.filter(p => p !== rp)[Math.floor(Math.random() * (stillRacing.length - 1))];
        evtText = pick.text(rp, other);
      } else if (pick.id === 'showmance-cheer') {
        const sh = (gs.showmances || []).find(s => s.phase !== 'broken-up' && s.players.includes(rp));
        if (sh) { const partner = sh.players.find(p => p !== rp); evtText = pick.text(rp, partner); }
      } else if ((pick.id === 'bike-smoking' || pick.id === 'wobble') && stillRacing.some(p => bikeHP[p] < 30)) {
        const lowHP = stillRacing.find(p => bikeHP[p] < 30);
        evtText = pick.text(lowHP, pronouns(lowHP));
      } else if (pick.id !== 'neck-and-neck' && pick.id !== 'rivalry-edge' && pick.id !== 'showmance-cheer' && pick.id !== 'bike-smoking' && pick.id !== 'wobble') {
        evtText = pick.text(rp, pr);
      }
      if (evtText) obstacleEvents.push({ obstacle: 'mines', text: evtText, players: [rp] });
    }
  }

  // --- Obstacle 2: Oil Slick ---
  stillRacing.forEach(name => {
    const s = pStats(name);
    const hpFactor = bikeHP[name] / 100;
    const score = s.physical * 0.3 + s.endurance * 0.25 + hpFactor * 0.2 + (Math.random() * 4 - 2) + familiarityBonus;
    let damage = 0, timePenalty = 0, outcome = '';
    if (score >= 7) { damage = Math.floor(Math.random() * 4); timePenalty = 0; outcome = 'power-through'; }
    else if (score >= 4) { damage = 8 + Math.floor(Math.random() * 8); timePenalty = 2; outcome = 'fishtail'; }
    else { damage = 15 + Math.floor(Math.random() * 10); timePenalty = 4; outcome = 'wipeout'; }
    bikeHP[name] -= damage;
    const oilDestroyed = bikeHP[name] <= 0 || (bikeHP[name] < 15 && Math.random() < 0.4);
    if (oilDestroyed) bikeHP[name] = 0;
    const oilBeats = OIL_BEATS[outcome] || OIL_BEATS.fishtail;
    const oilBeatText = oilBeats[Math.floor(Math.random() * oilBeats.length)](name, pronouns(name));
    obstacleResults[name].obstacles.push({ id: 'oil', score, damage, timePenalty, outcome, hpAfter: bikeHP[name], destroyed: oilDestroyed, beats: [oilBeatText] });
    obstacleResults[name].totalPenalty += timePenalty;
    if (oilDestroyed) {
      obstacleResults[name].destroyed = true;
      destroyed.push(name);
      badges[name] = 'bikeRaceWreck';
      popDelta(name, -1);
      chrisQuips[`destroyed-${name}`] = CHRIS_BIKE_QUIPS.bikeDestroyed[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.bikeDestroyed.length)];
    }
  });
  stillRacing = stillRacing.filter(p => !destroyed.includes(p));

  // Inter-events for oil
  {
    const interCount = 2 + (Math.random() < 0.4 ? 1 : 0);
    for (let ie = 0; ie < interCount && stillRacing.length >= 1; ie++) {
      const pick = OBSTACLE_INTER_EVENTS[Math.floor(Math.random() * OBSTACLE_INTER_EVENTS.length)];
      const rp = stillRacing[Math.floor(Math.random() * stillRacing.length)];
      const pr = pronouns(rp);
      let evtText = '';
      if ((pick.id === 'neck-and-neck' || pick.id === 'rivalry-edge') && stillRacing.length >= 2) {
        const other = stillRacing.filter(p => p !== rp)[Math.floor(Math.random() * (stillRacing.length - 1))];
        evtText = pick.text(rp, other);
      } else if (pick.id === 'showmance-cheer') {
        const sh = (gs.showmances || []).find(s => s.phase !== 'broken-up' && s.players.includes(rp));
        if (sh) { const partner = sh.players.find(p => p !== rp); evtText = pick.text(rp, partner); }
      } else if ((pick.id === 'bike-smoking' || pick.id === 'wobble') && stillRacing.some(p => bikeHP[p] < 30)) {
        const lowHP = stillRacing.find(p => bikeHP[p] < 30);
        evtText = pick.text(lowHP, pronouns(lowHP));
      } else if (pick.id !== 'neck-and-neck' && pick.id !== 'rivalry-edge' && pick.id !== 'showmance-cheer' && pick.id !== 'bike-smoking' && pick.id !== 'wobble') {
        evtText = pick.text(rp, pr);
      }
      if (evtText) obstacleEvents.push({ obstacle: 'oil', text: evtText, players: [rp] });
    }
  }

  // --- Obstacle 3: Piranha Pool Jump ---
  stillRacing.forEach(name => {
    const s = pStats(name);
    const hpFactor = bikeHP[name] / 100;
    const weightPenalty = (100 - bikeHP[name]) * 0.02;
    const score = s.physical * 0.3 + s.boldness * 0.35 + hpFactor * 0.2 + (Math.random() * 4 - 2) + familiarityBonus - weightPenalty;
    let damage = 0, timePenalty = 0, outcome = '';
    if (score >= 7) { damage = Math.floor(Math.random() * 4); timePenalty = 0; outcome = 'clear'; }
    else if (score >= 4) { damage = 8 + Math.floor(Math.random() * 8); timePenalty = 2; outcome = 'hard-landing'; }
    else { damage = 50 + Math.floor(Math.random() * 20); timePenalty = 0; outcome = 'piranha-splash'; } // likely destroyed but not guaranteed
    bikeHP[name] -= damage;
    const piranhaDestroyed = bikeHP[name] <= 0;
    if (piranhaDestroyed) bikeHP[name] = 0;
    const pirBeats = PIRANHA_BEATS[outcome] || PIRANHA_BEATS['hard-landing'];
    const pirBeatText = pirBeats[Math.floor(Math.random() * pirBeats.length)](name, pronouns(name));
    obstacleResults[name].obstacles.push({ id: 'piranhas', score, damage, timePenalty, outcome, hpAfter: bikeHP[name], destroyed: piranhaDestroyed, beats: [pirBeatText] });
    obstacleResults[name].totalPenalty += timePenalty;
    if (piranhaDestroyed) {
      obstacleResults[name].destroyed = true;
      destroyed.push(name);
      badges[name] = 'bikeRaceWreck';
      popDelta(name, -1);
      chrisQuips[`destroyed-${name}`] = CHRIS_BIKE_QUIPS.bikeDestroyed[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.bikeDestroyed.length)];
    } else if (bikeHP[name] < 20 && !destroyed.includes(name)) {
      badges[name] = badges[name] || 'bikeRaceClutch';
      popDelta(name, 1);
    }
  });
  stillRacing = stillRacing.filter(p => !destroyed.includes(p));

  // Inter-events for piranhas
  {
    const interCount = 2 + (Math.random() < 0.4 ? 1 : 0);
    for (let ie = 0; ie < interCount && stillRacing.length >= 1; ie++) {
      const pick = OBSTACLE_INTER_EVENTS[Math.floor(Math.random() * OBSTACLE_INTER_EVENTS.length)];
      const rp = stillRacing[Math.floor(Math.random() * stillRacing.length)];
      const pr = pronouns(rp);
      let evtText = '';
      if ((pick.id === 'neck-and-neck' || pick.id === 'rivalry-edge') && stillRacing.length >= 2) {
        const other = stillRacing.filter(p => p !== rp)[Math.floor(Math.random() * (stillRacing.length - 1))];
        evtText = pick.text(rp, other);
      } else if (pick.id === 'showmance-cheer') {
        const sh = (gs.showmances || []).find(s => s.phase !== 'broken-up' && s.players.includes(rp));
        if (sh) { const partner = sh.players.find(p => p !== rp); evtText = pick.text(rp, partner); }
      } else if ((pick.id === 'bike-smoking' || pick.id === 'wobble') && stillRacing.some(p => bikeHP[p] < 30)) {
        const lowHP = stillRacing.find(p => bikeHP[p] < 30);
        evtText = pick.text(lowHP, pronouns(lowHP));
      } else if (pick.id !== 'neck-and-neck' && pick.id !== 'rivalry-edge' && pick.id !== 'showmance-cheer' && pick.id !== 'bike-smoking' && pick.id !== 'wobble') {
        evtText = pick.text(rp, pr);
      }
      if (evtText) obstacleEvents.push({ obstacle: 'piranhas', text: evtText, players: [rp] });
    }
  }

  // Final ranking of finishers
  const finishRanking = [...stillRacing].sort((a, b) => {
    const aTime = -(pStats(a).physical * 0.2 + pStats(a).endurance * 0.2 + bikeHP[a] * 0.01 - obstacleResults[a].totalPenalty);
    const bTime = -(pStats(b).physical * 0.2 + pStats(b).endurance * 0.2 + bikeHP[b] * 0.01 - obstacleResults[b].totalPenalty);
    return aTime - bTime; // lower time = better
  });

  const immunityWinner = finishRanking[0] || null;
  const lastPlace = finishRanking.length >= 2 ? finishRanking[finishRanking.length - 1] : null;

  const phase3 = { racers, obstacleResults, destroyed, obstacleEvents, finishRanking, bikeHP: { ...bikeHP } };

  // ══ PHASE 4: ELIMINATION REACTIONS ══
  let eliminationReaction = null;
  const eliminatedPlayer = lastPlace; // might be null if <= 1 finisher

  if (eliminatedPlayer) {
    const elimPr = pronouns(eliminatedPlayer);
    const beats = [];

    // Check for sabotage betrayal
    const sabotageEvt = buildEvents.find(e => e.id === 'sabotage' && e.effect?.target === eliminatedPlayer && !e.effect.detected);
    // Check for BFF betrayal (high bond with someone who hurt them)
    const highBondBetrayer = activePlayers.find(p => p !== eliminatedPlayer && getBond(eliminatedPlayer, p) >= 6 &&
      (buildEvents.some(e => e.id === 'sabotage' && e.effect?.saboteur === p && e.effect?.target === eliminatedPlayer) ||
       (riderAssignments[p] === eliminatedPlayer && failures.includes(p)) // they rode eliminated player's bike badly
      ));
    // Check for showmance
    const showmance = (gs.showmances || []).find(sh => sh.phase !== 'broken-up' && sh.players.includes(eliminatedPlayer) && sh.players.some(p => p !== eliminatedPlayer && activePlayers.includes(p)));

    if (highBondBetrayer) {
      // BFF Betrayal — Lindsay/Heather moment
      eliminationReaction = { type: 'bff-betrayal', players: [eliminatedPlayer, highBondBetrayer], beats: [] };
      const tmpl = REACTION_TEMPLATES;
      eliminationReaction.beats.push(tmpl.bffExplosion[Math.floor(Math.random() * tmpl.bffExplosion.length)](eliminatedPlayer, highBondBetrayer));
      eliminationReaction.beats.push(tmpl.bffCallout[Math.floor(Math.random() * tmpl.bffCallout.length)](eliminatedPlayer, highBondBetrayer));
      eliminationReaction.beats.push(tmpl.crowdCheer[Math.floor(Math.random() * tmpl.crowdCheer.length)](eliminatedPlayer));
      addBond(eliminatedPlayer, highBondBetrayer, -(getBond(eliminatedPlayer, highBondBetrayer) + 5)); // drop to -5
      popDelta(eliminatedPlayer, 3);
      popDelta(highBondBetrayer, -3);
    } else if (sabotageEvt) {
      // Sabotage confrontation
      const saboteur = sabotageEvt.effect.saboteur;
      eliminationReaction = { type: 'sabotage-confrontation', players: [eliminatedPlayer, saboteur], beats: [] };
      const tmpl = REACTION_TEMPLATES;
      eliminationReaction.beats.push(tmpl.betrayalCallout[Math.floor(Math.random() * tmpl.betrayalCallout.length)](eliminatedPlayer, saboteur));
      if (isVillainArch(saboteur)) {
        eliminationReaction.beats.push(tmpl.betrayerSmirk[Math.floor(Math.random() * tmpl.betrayerSmirk.length)](saboteur, pronouns(saboteur)));
      } else {
        eliminationReaction.beats.push(tmpl.betrayerGuilty[Math.floor(Math.random() * tmpl.betrayerGuilty.length)](saboteur, pronouns(saboteur)));
      }
      addBond(eliminatedPlayer, saboteur, -3);
      popDelta(eliminatedPlayer, 2);
      popDelta(saboteur, -2);
    } else if (showmance) {
      // Showmance heartbreak
      const partner = showmance.players.find(p => p !== eliminatedPlayer);
      eliminationReaction = { type: 'showmance-heartbreak', players: [eliminatedPlayer, partner], beats: [] };
      const tmpl = REACTION_TEMPLATES;
      eliminationReaction.beats.push(tmpl.showmanceGoodbye[Math.floor(Math.random() * tmpl.showmanceGoodbye.length)](eliminatedPlayer, partner, pronouns(partner)));
      addBond(eliminatedPlayer, partner, 2);
    } else {
      // Graceful exit
      eliminationReaction = { type: 'graceful-exit', players: [eliminatedPlayer], beats: [] };
      const tmpl = REACTION_TEMPLATES;
      eliminationReaction.beats.push(tmpl.gracefulExit[Math.floor(Math.random() * tmpl.gracefulExit.length)](eliminatedPlayer));
      // Closest ally
      const closestAlly = activePlayers.filter(p => p !== eliminatedPlayer).sort((a, b) => getBond(eliminatedPlayer, b) - getBond(eliminatedPlayer, a))[0];
      if (closestAlly) {
        addBond(eliminatedPlayer, closestAlly, 1);
        eliminationReaction.beats.push(`${eliminatedPlayer} hugged ${closestAlly}. "I'll miss you the most."`);
      }
    }
  }

  const phase4 = { eliminatedPlayer, eliminationReaction };

  // ══ RESULTS ══
  if (immunityWinner) {
    badges[immunityWinner] = 'bikeRaceImmune';
    popDelta(immunityWinner, 2);
    chrisQuips['immunity'] = CHRIS_BIKE_QUIPS.immunityWin[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.immunityWin.length)];
  }
  if (lastPlace) {
    badges[lastPlace] = badges[lastPlace] || 'bikeRaceLast';
    popDelta(lastPlace, -2);
    chrisQuips['lastPlace'] = CHRIS_BIKE_QUIPS.lastPlace[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.lastPlace.length)];
  }

  // Set episode fields
  ep.immunityWinner = immunityWinner;
  ep.challengeType = 'individual';
  ep.challengeLabel = "That's Off the Chain!";
  ep.challengeCategory = 'mixed';
  ep.challengeDesc = 'Build a bike, swap, race, survive obstacles. First place wins immunity. Last place pays the price.';

  // Sudden death: auto-eliminate last place. Normal: tribal with heat.
  const isSuddenDeath = ep.isSuddenDeath || (ep.twists || []).some(t => t.type === 'sudden-death');
  if (isSuddenDeath && lastPlace) {
    ep.eliminated = lastPlace;
    ep.tribalPlayers = [];
  } else {
    ep.tribalPlayers = activePlayers.filter(p => p !== immunityWinner && p !== gs.exileDuelPlayer);
    if (lastPlace) {
      if (!gs._bikeRaceHeat) gs._bikeRaceHeat = {};
      gs._bikeRaceHeat[lastPlace] = { target: lastPlace, amount: 3.0, expiresEp: (gs.episode || 0) + 4 };
    }
    destroyed.forEach(p => {
      if (!gs._bikeRaceHeat) gs._bikeRaceHeat = {};
      if (!gs._bikeRaceHeat[p]) gs._bikeRaceHeat[p] = { target: p, amount: 1.5, expiresEp: (gs.episode || 0) + 4 };
    });
  }

  // Challenge record
  if (immunityWinner) updateChalRecord(immunityWinner, 'win');
  if (lastPlace) updateChalRecord(lastPlace, 'loss');

  // chalMemberScores for debug
  ep.chalMemberScores = {};
  activePlayers.forEach(name => {
    let score = bikeQuality[name] * 0.5;
    if (advancingOwners.includes(name)) score += 3;
    if (stillRacing.includes(name)) score += 3;
    const rank = finishRanking.indexOf(name);
    if (rank >= 0) score += (finishRanking.length - rank) * 2;
    if (immunityWinner === name) score += 5;
    ep.chalMemberScores[name] = score;
  });
  ep.chalPlacements = Object.entries(ep.chalMemberScores).sort(([,a],[,b]) => b - a).map(([n]) => n);

  // Badge camp events
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  const badgeLabels = {
    bikeRaceImmune: { text: 'Won the Race', cls: 'win' },
    bikeRaceBuilder: { text: 'Best Bike', cls: 'green' },
    bikeRaceWreck: { text: 'Bike Destroyed', cls: '' },
    bikeRaceLast: { text: 'Finished Last', cls: 'bad' },
    bikeRaceSaboteur: { text: 'Sabotaged a Bike', cls: 'bad' },
    bikeRaceClutch: { text: 'Survived on Fumes', cls: 'win' },
  };
  Object.entries(badges).forEach(([name, badge]) => {
    const label = badgeLabels[badge];
    if (label) {
      ep.campEvents[campKey].post.push({ type: 'bike-race-badge', text: `${name}: ${label.text}`, players: [name], badgeText: label.text, badgeClass: label.cls });
    }
  });

  ep.bikeRace = { phase1, phase2, phase3, phase4, badges, chrisQuips, activePlayers, isSuddenDeath };
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textOffTheChain(ep, ln, sec) {
  if (!ep.isOffTheChain || !ep.bikeRace) return;
  const br = ep.bikeRace;

  sec("THAT'S OFF THE CHAIN!");
  ln(`${br.activePlayers.length} campers were tasked with building their own bikes — then racing them through a deadly obstacle course.`);

  sec('The Build Phase');
  ln(`${br.phase1.bestBuilder} built the best bike ("${br.phase1.bikeNames[br.phase1.bestBuilder]}") while ${br.phase1.worstBuilder} struggled.`);
  br.phase1.buildEvents.forEach(e => { if (e.text) ln(e.text); });

  sec('The Swap');
  ln(`In a cruel twist, campers drew names and raced someone else's bike.`);
  const escorted = br.phase2.finishers.map(r => `${r} crossed on ${br.phase2.riderAssignments[r]}'s bike`);
  if (escorted.length) ln(escorted.slice(0, 3).join('. ') + '.');
  ln(`${br.phase2.failures.length} riders failed to finish — their bike owners were eliminated from Part 2.`);

  sec('The Obstacle Gauntlet');
  const { finishRanking, destroyed } = br.phase3;
  if (destroyed.length) {
    ln(`${destroyed.join(', ')} had ${destroyed.length === 1 ? 'their bike' : 'their bikes'} destroyed — out of the race but safe from elimination.`);
  }
  br.phase3.obstacleEvents.forEach(e => { if (e.text) ln(e.text); });

  sec('The Finish Line');
  if (br.phase3.finishRanking.length === 0) {
    ln(`Every single bike was destroyed! No one crossed the finish line.`);
    if (br.phase3.destroyed.length) ln(`${br.phase3.destroyed.join(', ')} are all safe — you can't finish last if you never finished.`);
  } else if (br.phase3.finishRanking.length === 1) {
    const winner = br.phase3.finishRanking[0];
    ln(`${winner} was the only one to finish the race — immunity by default!`);
  } else {
    const winner = br.phase3.finishRanking[0];
    const last = br.phase3.finishRanking[br.phase3.finishRanking.length - 1];
    ln(`${winner} crossed the finish line first and won immunity!`);
    if (br.isSuddenDeath) {
      ln(`${last} finished last and was automatically eliminated. The Dock of Shame awaits.`);
    } else {
      ln(`${last} finished last — a major target heading into tribal council.`);
    }
  }

  if (br.phase4.eliminationReaction?.beats?.length) {
    sec('The Aftermath');
    br.phase4.eliminationReaction.beats.forEach(b => ln(b));
  }
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN — MOTOCROSS DEMOLITION DERBY THEME
// ══════════════════════════════════════════════════════════════

const MX_STYLES = `
  .mx-page { background:#1a1008; color:#ff6b00; font-family:'Impact','Arial Narrow',sans-serif; position:relative; overflow:hidden; padding:24px; }
  .mx-page::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:
    radial-gradient(ellipse at 20% 80%, rgba(101,67,33,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 20%, rgba(101,67,33,0.1) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 50%, rgba(101,67,33,0.08) 0%, transparent 60%);
    pointer-events:none; z-index:1; }
  .mx-header { display:flex; align-items:center; gap:8px; margin-bottom:20px; position:relative; z-index:2;
    background:repeating-conic-gradient(#1a1008 0% 25%, #ff6b00 0% 50%) 0 0 / 20px 20px;
    padding:12px 16px; border-radius:4px; }
  .mx-header-inner { background:#1a1008; padding:8px 16px; border-radius:3px; display:flex; align-items:center; gap:8px; width:100%; }
  .mx-title { font-size:20px; font-weight:800; letter-spacing:4px; text-transform:uppercase; color:#ff6b00; text-shadow:0 0 10px rgba(255,107,0,0.5); }
  .mx-card { background:rgba(255,107,0,0.05); border:1px solid rgba(255,107,0,0.15); border-radius:6px; padding:10px 14px; margin-bottom:8px; position:relative; z-index:2; }
  .mx-status { display:inline-block; padding:2px 8px; border-radius:3px; font-size:10px; font-weight:700; letter-spacing:1px; }
  .mx-safe { background:rgba(0,200,100,0.2); color:#0c6; }
  .mx-wrecked { background:rgba(255,51,51,0.2); color:#ff3333; }
  .mx-immune { background:rgba(255,215,0,0.2); color:#ffd700; }
  .mx-last { background:rgba(255,51,51,0.2); color:#ff3333; }
  .mx-dnf { background:rgba(100,100,100,0.2); color:#666; }
  .mx-racing { background:rgba(255,107,0,0.15); color:#ff6b00; }
  .mx-sector { font-size:11px; font-weight:800; letter-spacing:3px; color:#ffd700; text-transform:uppercase; margin:20px 0 12px; border-top:1px solid rgba(255,107,0,0.15); padding-top:16px; }
  .mx-reveal-btn { background:rgba(255,107,0,0.1); border:1px solid rgba(255,107,0,0.3); color:#ff6b00; padding:8px 20px; border-radius:4px; cursor:pointer; font-family:'Impact','Arial Narrow',sans-serif; font-size:12px; letter-spacing:2px; text-transform:uppercase; margin:12px 0; animation: mx-btn-pulse 2s infinite; }
  .mx-reveal-btn:hover { background:rgba(255,107,0,0.2); }
  .mx-quality-bar { height:6px; border-radius:3px; background:rgba(255,107,0,0.1); overflow:hidden; margin-top:4px; }
  .mx-quality-fill { height:100%; border-radius:3px; transition:width 0.3s; }
  .mx-hp-bar { height:8px; border-radius:4px; background:rgba(255,51,51,0.15); overflow:hidden; margin-top:4px; }
  .mx-hp-fill { height:100%; border-radius:4px; transition:width 0.5s; }
  .mx-hazard { background:repeating-linear-gradient(45deg, rgba(255,215,0,0.08), rgba(255,215,0,0.08) 10px, rgba(0,0,0,0.08) 10px, rgba(0,0,0,0.08) 20px); border:1px solid rgba(255,215,0,0.2); border-radius:4px; padding:8px 12px; margin-bottom:8px; }
  .mx-speed-lines { position:relative; overflow:hidden; }
  .mx-speed-lines::after { content:''; position:absolute; top:0; left:0; right:0; bottom:0;
    background:repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(255,107,0,0.03) 8px, rgba(255,107,0,0.03) 10px);
    animation: mx-speed 1s linear infinite; pointer-events:none; }
  @keyframes mx-speed { 0%{transform:translateX(0)} 100%{transform:translateX(-20px)} }
  @keyframes mx-explosion { 0%{transform:scale(0.5);opacity:1} 40%{transform:scale(1.5);opacity:0.9} 70%{transform:scale(1.8);opacity:0.5} 100%{transform:scale(2);opacity:0} }
  .mx-explosion { position:absolute; top:50%; left:50%; width:60px; height:60px; margin:-30px 0 0 -30px;
    background:radial-gradient(circle,#ffd700 0%,#ff6b00 40%,#ff3333 70%,transparent 100%);
    border-radius:50%; animation: mx-explosion 0.8s ease-out forwards; pointer-events:none; z-index:10; }
  @keyframes mx-scan-in { 0% { opacity:0; clip-path:inset(0 100% 0 0); } 100% { opacity:1; clip-path:inset(0 0 0 0); } }
  .mx-scan-in { animation: mx-scan-in 0.3s ease-out both; }
  @keyframes mx-shake { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-4px)} 30%,60%,90%{transform:translateX(4px)} }
  .mx-shake { animation: mx-shake 0.4s; }
  @keyframes mx-drop-in { 0%{opacity:0;transform:translateY(-40px)} 60%{transform:translateY(4px)} 100%{opacity:1;transform:translateY(0)} }
  .mx-drop-in { animation: mx-drop-in 0.5s ease-out both; }
  @keyframes mx-btn-pulse { 0%,100%{box-shadow:0 0 5px rgba(255,107,0,0.1)} 50%{box-shadow:0 0 15px rgba(255,107,0,0.3)} }
  @keyframes mx-count-flash { 0%{color:#fff;transform:scale(1.3)} 100%{color:inherit;transform:scale(1)} }
  .mx-count-flash { animation: mx-count-flash 0.3s ease-out; }
`;

function _mxChrisQuip(quips, key) {
  const q = quips?.[key];
  if (!q) return '';
  return `<div style="font-size:11px;color:#8b949e;font-style:italic;margin-bottom:6px;padding-left:4px">${q}</div>`;
}

export function rpBuildOffTheChain(ep) {
  const br = ep.bikeRace;
  if (!br) return '';
  const stateKey = String(ep.num) + '_offChain';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };

  const steps = [];

  // ── STARTING GRID ──
  steps.push({
    type: 'grid-header',
    html: `
      <div class="mx-card" style="text-align:center;max-width:500px;margin:0 auto 20px">
        <div style="font-size:36px;margin-bottom:8px">🏍️</div>
        <div class="mx-title" style="font-size:16px;margin-bottom:8px">THAT'S OFF THE CHAIN!</div>
        <div style="font-size:12px;color:#ff6b00;line-height:1.8">
          ${br.activePlayers.length} campers must build a bike, swap with someone else, and race through a deadly obstacle course.<br>
          <strong style="color:#ffd700">First place wins immunity. Last place pays the price.</strong>
        </div>
      </div>
    `
  });

  // Phase 1 announcement
  steps.push({ type: 'phase-header', html: `<div class="mx-sector" style="font-size:14px;text-align:center;padding:12px 0;border-top:2px solid rgba(255,107,0,0.3)">🔧 PHASE 1: THE BUILD — CONSTRUCT YOUR RIDE</div>` });

  // Per-player bike cards with build events interspersed
  const buildEvts = br.phase1.buildEvents || [];
  let buildEvtIdx = 0;
  br.activePlayers.forEach((name, pi) => {
    const q = br.phase1.bikeQuality[name];
    const qPct = Math.round((q / 10) * 100);
    const qColor = q >= 7 ? '#00ff41' : q >= 5 ? '#ffd700' : q >= 3 ? '#ff6b00' : '#ff3333';
    const qLabel = q >= 7 ? 'EXCELLENT' : q >= 5 ? 'SOLID' : q >= 3 ? 'SHAKY' : 'JUNK';
    const bikeName = br.phase1.bikeNames[name];
    const quip = _mxChrisQuip(br.chrisQuips, `judge-${name}`);
    const isBest = name === br.phase1.bestBuilder;
    const isWorst = name === br.phase1.worstBuilder;
    const tag = isBest ? ' <span class="mx-status mx-safe">BEST BUILD</span>' : isWorst ? ' <span class="mx-status mx-wrecked">WORST BUILD</span>' : '';
    steps.push({
      type: 'grid-bike',
      html: `
        ${quip}
        <div class="mx-card" style="display:flex;align-items:center;gap:12px${isBest ? ';border-color:rgba(0,200,100,0.3)' : isWorst ? ';border-color:rgba(255,51,51,0.3)' : ''}">
          ${rpPortrait(name, 'sm')}
          <div style="flex:1">
            <div style="font-size:13px;color:#cdd9e5;font-weight:600">${name}${tag}</div>
            <div style="font-size:11px;color:#ff6b00;margin-top:2px">"${bikeName}"</div>
            <div class="mx-quality-bar">
              <div class="mx-quality-fill" style="width:${qPct}%;background:${qColor}"></div>
            </div>
            <div style="font-size:9px;color:${qColor};margin-top:2px;letter-spacing:1px">${qLabel} (${q.toFixed(1)})</div>
          </div>
        </div>
      `
    });
    // Inject a build event after every 3-4 bike cards
    if ((pi + 1) % 3 === 0 && buildEvtIdx < buildEvts.length) {
      const evt = buildEvts[buildEvtIdx++];
      if (evt.text) {
        const portraits = (evt.players || []).slice(0, 2).map(p => rpPortrait(p, 'sm')).join('');
        const isSab = evt.id === 'sabotage' || evt.id === 'parts-theft';
        const borderStyle = isSab ? 'border-color:rgba(255,51,51,0.3)' : evt.id === 'help' ? 'border-color:rgba(0,200,100,0.3)' : '';
        steps.push({
          type: 'build-event',
          html: `<div class="mx-card" style="display:flex;align-items:center;gap:10px;${borderStyle}">${portraits}<div style="flex:1;font-size:12px;color:#cdd9e5">${evt.text}</div></div>`
        });
      }
    }
  });
  // Remaining build events
  while (buildEvtIdx < buildEvts.length) {
    const evt = buildEvts[buildEvtIdx++];
    if (evt.text) {
      const portraits = (evt.players || []).slice(0, 2).map(p => rpPortrait(p, 'sm')).join('');
      const isSab = evt.id === 'sabotage' || evt.id === 'parts-theft';
      const borderStyle = isSab ? 'border-color:rgba(255,51,51,0.3)' : evt.id === 'help' ? 'border-color:rgba(0,200,100,0.3)' : '';
      steps.push({
        type: 'build-event',
        html: `<div class="mx-card" style="display:flex;align-items:center;gap:10px;${borderStyle}">${portraits}<div style="flex:1;font-size:12px;color:#cdd9e5">${evt.text}</div></div>`
      });
    }
  }

  // ── THE SWAP ──
  steps.push({ type: 'phase-header', html: `<div class="mx-sector" style="font-size:14px;text-align:center;padding:12px 0;border-top:2px solid rgba(255,107,0,0.3)">🎲 THE TWIST — DRAW NAMES, SWAP BIKES!</div>` });
  const swapQuipKey = Object.keys(br.chrisQuips).find(k => k.startsWith('swap'));
  steps.push({
    type: 'swap-header',
    html: `
      ${_mxChrisQuip(br.chrisQuips, swapQuipKey || 'swapReveal')}
      <div class="mx-sector">THE SWAP — RIDE SOMEONE ELSE'S BIKE!</div>
      <div class="mx-hazard" style="text-align:center;font-size:12px;color:#ffd700">
        Chris reveals: nobody rides their own bike. You race what someone else built!
      </div>
    `
  });

  // Each assignment revealed one at a time
  const assignments = br.phase2.riderAssignments || {};
  Object.entries(assignments).forEach(([rider, bikeOwner]) => {
    steps.push({
      type: 'swap-assign',
      html: `
        <div class="mx-card" style="display:flex;align-items:center;gap:12px">
          ${rpPortrait(rider, 'sm')}
          <div style="flex:1">
            <div style="font-size:13px;color:#cdd9e5;font-weight:600">${rider} draws...</div>
            <div style="font-size:12px;color:#ff6b00;margin-top:4px">${bikeOwner}'s bike! <span style="color:#8b949e">("${br.phase1.bikeNames[bikeOwner] || '???'}")</span></div>
          </div>
          <div style="text-align:right">
            <div style="font-size:10px;color:${(br.phase1.bikeQuality[bikeOwner] || 5) >= 5 ? '#00ff41' : '#ff3333'};letter-spacing:1px">
              ${(br.phase1.bikeQuality[bikeOwner] || 5) >= 7 ? 'LUCKY' : (br.phase1.bikeQuality[bikeOwner] || 5) >= 5 ? 'DECENT' : (br.phase1.bikeQuality[bikeOwner] || 5) >= 3 ? 'UH OH' : 'DOOMED'}
            </div>
          </div>
        </div>
      `
    });
  });

  // ── PART 1: QUALIFYING ──
  steps.push({ type: 'phase-header', html: `<div class="mx-sector" style="font-size:14px;text-align:center;padding:12px 0;border-top:2px solid rgba(255,107,0,0.3)">🏁 PART 1: QUALIFYING LAP — RIDE SOMEONE ELSE'S BIKE!</div>` });
  steps.push({
    type: 'race1-header',
    html: `
      ${_mxChrisQuip(br.chrisQuips, 'race1Start') || _mxChrisQuip(br.chrisQuips, 'race1-start')}
      <div class="mx-sector">PART 1: QUALIFYING LAP</div>
    `
  });

  // Per-rider results with race events interspersed
  const sortedRiders = br.phase2.sortedRiders || [];
  const race1Evts = br.phase2.race1Events || [];
  let race1EvtIdx = 0;
  sortedRiders.forEach((name, ri) => {
    const score = (br.phase2.race1Scores || {})[name] || 0;
    const cutIdx = br.phase2.cutIndex || Math.ceil(sortedRiders.length / 2);
    const finished = sortedRiders.indexOf(name) < cutIdx;
    const quipKey = finished ? 'race1Finish' : 'race1Fail';
    const quipPool = CHRIS_BIKE_QUIPS[quipKey] || [];
    const quip = quipPool.length ? quipPool[Math.floor(Math.random() * quipPool.length)] : '';
    steps.push({
      type: 'race1-result',
      racingDelta: finished ? 0 : -1,
      wreckedDelta: finished ? 0 : 1,
      html: `
        <div class="mx-card mx-speed-lines" style="display:flex;align-items:center;gap:12px;${!finished ? 'border-color:rgba(255,51,51,0.3);background:rgba(255,51,51,0.04)' : 'border-color:rgba(0,200,100,0.15)'}">
          ${rpPortrait(name, 'sm')}
          <div style="flex:1">
            <div style="font-size:13px;color:#cdd9e5;font-weight:600">${name} <span style="font-size:10px;color:#8b949e;font-weight:400">riding ${br.phase2.riderAssignments[name]}'s bike</span></div>
            <div style="font-size:10px;color:#ff6b00;margin-top:2px">Score: ${score.toFixed ? score.toFixed(1) : score}</div>
            ${quip ? `<div style="font-size:10px;color:#8b949e;font-style:italic;margin-top:2px">${quip}</div>` : ''}
          </div>
          <div style="text-align:right">
            <span class="mx-status ${finished ? 'mx-safe' : 'mx-dnf'}">${finished ? 'QUALIFIED' : 'DNF'}</span>
            <div style="font-size:9px;color:${finished ? '#00ff41' : '#ff3333'};margin-top:2px">${finished ? `${br.phase2.riderAssignments[name]} advances` : `${br.phase2.riderAssignments[name]} eliminated`}</div>
          </div>
        </div>
      `
    });
    // Inject race event after every 3 riders
    if ((ri + 1) % 3 === 0 && race1EvtIdx < race1Evts.length) {
      const evt = race1Evts[race1EvtIdx++];
      if (evt.text) {
        const evtPortraits = (evt.players || []).slice(0, 2).map(p => rpPortrait(p, 'sm')).join('');
        steps.push({
          type: 'race1-event',
          html: `<div class="mx-card" style="display:flex;align-items:center;gap:10px;border-color:rgba(255,107,0,0.2)">${evtPortraits}<div style="flex:1;font-size:12px;color:#cdd9e5;font-style:italic">${evt.text}</div></div>`
        });
      }
    }
  });
  // Remaining race events
  while (race1EvtIdx < race1Evts.length) {
    const evt = race1Evts[race1EvtIdx++];
    if (evt.text) {
      const evtPortraits = (evt.players || []).slice(0, 2).map(p => rpPortrait(p, 'sm')).join('');
      steps.push({
        type: 'race1-event',
        html: `<div class="mx-card" style="display:flex;align-items:center;gap:10px;border-color:rgba(255,107,0,0.2)">${evtPortraits}<div style="flex:1;font-size:12px;color:#cdd9e5;font-style:italic">${evt.text}</div></div>`
      });
    }
  }

  // ── THE CUT ──
  const advancingOwners = br.phase2.advancingOwners || [];
  const eliminatedOwners = br.phase2.eliminatedOwners || [];
  steps.push({
    type: 'cut-summary',
    html: `
      <div class="mx-sector">THE CUT — WHO ADVANCES?</div>
      <div class="mx-card" style="padding:14px">
        <div style="font-size:12px;color:#ffd700;margin-bottom:10px;font-weight:700">ADVANCING TO OBSTACLE GAUNTLET:</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
          ${advancingOwners.map(name => `
            <div style="text-align:center;width:70px">
              ${rpPortrait(name, 'sm')}
              <div style="font-size:9px;color:#00ff41;margin-top:2px">SAFE</div>
              <div class="mx-hp-bar"><div class="mx-hp-fill" style="width:${Math.round(((br.phase2.bikeHP || br.phase1.bikeHP || {})[name] || 50) / ((br.phase1.bikeHP || {})[name] || 100) * 100)}%;background:#00ff41"></div></div>
            </div>
          `).join('')}
        </div>
        ${eliminatedOwners.length ? `
          <div style="font-size:12px;color:#ff3333;margin-bottom:8px;font-weight:700">ELIMINATED FROM PART 2:</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${eliminatedOwners.map(name => `
              <div style="text-align:center;width:70px">
                ${rpPortrait(name, 'sm')}
                <div style="font-size:9px;color:#ff3333;margin-top:2px">CUT</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `
  });

  // ── PART 2: OBSTACLES ──
  steps.push({ type: 'phase-header', html: `<div class="mx-sector" style="font-size:14px;text-align:center;padding:12px 0;border-top:2px solid rgba(255,107,0,0.3)">💥 PART 2: THE OBSTACLE GAUNTLET — LAND MINES, OIL SLICK, PIRANHAS!</div>` });
  steps.push({
    type: 'obstacle-header',
    html: `
      ${_mxChrisQuip(br.chrisQuips, 'obstacleStart') || _mxChrisQuip(br.chrisQuips, 'obstacle-start')}
      <div class="mx-sector">PART 2: THE OBSTACLE GAUNTLET</div>
      <div class="mx-hazard" style="text-align:center;font-size:11px;color:#ffd700">
        Land mines. Oil slicks. Piranhas. Only the strongest bikes survive.
      </div>
    `
  });

  // Per-obstacle, per-racer with narrative beats interspersed
  const obstacleResults = br.phase3.obstacleResults || {};
  const racers = br.phase3.racers || advancingOwners;
  const maxObstacles = Math.max(...racers.map(n => (obstacleResults[n]?.obstacles || []).length), 0);
  const obstacleNames = ['LAND MINES 💣', 'OIL SLICK 🛢️', 'PIRANHA POOL JUMP 🐟'];

  for (let oi = 0; oi < maxObstacles; oi++) {
    // Obstacle header
    steps.push({
      type: 'obstacle-name',
      html: `<div class="mx-hazard" style="font-size:12px;color:#ffd700;font-weight:700;letter-spacing:2px;text-align:center;padding:8px 0">⚠ ${obstacleNames[oi] || 'OBSTACLE ' + (oi + 1)} ⚠</div>`
    });

    // Get inter-events for this obstacle
    const obsIds = ['mines', 'oil', 'piranhas'];
    const interEvtsForObs = (br.phase3.obstacleEvents || []).filter(e => {
      return e.obstacle === obsIds[oi] || e.obstacle === 'obstacle';
    });
    let interEvtIdx = 0;

    racers.forEach((name, ri) => {
      const data = obstacleResults[name];
      if (!data || !data.obstacles || !data.obstacles[oi]) return;
      // Skip if already destroyed in a previous obstacle
      if (oi > 0 && data.obstacles[oi - 1]?.destroyed) return;

      const obs = data.obstacles[oi];
      const wasDestroyed = obs.destroyed || false;
      const damage = obs.damage || 0;
      const hpAfter = typeof obs.hpAfter === 'number' ? obs.hpAfter : 50;
      const hpMax = data.bikeHPStart || 100;
      const hpPct = Math.max(0, Math.round((hpAfter / hpMax) * 100));
      const hpColor = hpPct > 60 ? '#00ff41' : hpPct > 30 ? '#ffd700' : '#ff3333';

      // Narrative beats
      const beats = obs.beats || [];
      const beatHtml = beats.map(b => `<div style="font-size:11px;color:#cdd9e5;margin-top:4px;padding-left:10px;border-left:2px solid ${wasDestroyed ? 'rgba(255,51,51,0.3)' : 'rgba(255,107,0,0.2)'}">${b}</div>`).join('');

      let cardContent = `
        <div class="mx-card${wasDestroyed ? ' mx-shake' : ' mx-speed-lines'}" style="position:relative;${wasDestroyed ? 'border-color:rgba(255,51,51,0.5);background:rgba(255,51,51,0.08)' : ''}">
          ${wasDestroyed ? '<div class="mx-explosion"></div>' : ''}
          <div style="display:flex;align-items:center;gap:12px">
            ${rpPortrait(name, 'sm')}
            <div style="flex:1">
              <div style="font-size:13px;color:#cdd9e5;font-weight:600">${name}</div>
              ${damage ? `<div style="font-size:10px;color:#ff3333;margin-top:2px">Damage: -${damage} HP</div>` : '<div style="font-size:10px;color:#00ff41;margin-top:2px">Clean pass!</div>'}
              ${!wasDestroyed ? `<div style="display:flex;align-items:center;gap:6px;margin-top:3px"><div class="mx-hp-bar" style="flex:1"><div class="mx-hp-fill" style="width:${hpPct}%;background:${hpColor}"></div></div><span style="font-size:9px;color:${hpColor};font-weight:700;min-width:35px">${hpAfter}/${hpMax}</span></div>` : ''}
            </div>
            <span class="mx-status ${wasDestroyed ? 'mx-wrecked' : 'mx-safe'}">${wasDestroyed ? 'DESTROYED' : 'RACING'}</span>
          </div>
          ${beatHtml}
        </div>
      `;

      // Chris quip for destruction
      const destroyQuip = wasDestroyed ? _mxChrisQuip(br.chrisQuips, `destroyed-${name}`) : '';

      steps.push({
        type: 'obstacle-result',
        racingDelta: wasDestroyed ? -1 : 0,
        wreckedDelta: wasDestroyed ? 1 : 0,
        html: cardContent + destroyQuip
      });

      // Inject inter-rider event after every 2-3 riders
      if ((ri + 1) % 2 === 0 && interEvtIdx < interEvtsForObs.length) {
        const interEvt = interEvtsForObs[interEvtIdx++];
        steps.push({
          type: 'obstacle-inter-event',
          html: `<div class="mx-card" style="border-color:rgba(255,107,0,0.2);font-size:12px;color:#cdd9e5;font-style:italic;padding:8px 12px">${interEvt.text}</div>`
        });
      }
    });
  }

  // ── FINISH LINE ──
  steps.push({ type: 'phase-header', html: `<div class="mx-sector" style="font-size:14px;text-align:center;padding:12px 0;border-top:2px solid rgba(255,107,0,0.3)">🏆 THE FINISH LINE</div>` });
  const finishRanking = br.phase3.finishRanking || [];
  if (finishRanking.length) {
    const winner = finishRanking[0];
    const last = finishRanking[finishRanking.length - 1];
    const winQuip = _mxChrisQuip(br.chrisQuips, 'immunityWin') || _mxChrisQuip(br.chrisQuips, `immunity-${winner}`);
    const lastQuip = _mxChrisQuip(br.chrisQuips, 'lastPlace') || _mxChrisQuip(br.chrisQuips, `last-${last}`);

    steps.push({
      type: 'finish-header',
      html: `<div class="mx-sector">THE FINISH LINE</div>`
    });

    // Winner
    steps.push({
      type: 'finish-winner',
      finishedDelta: 1,
      immuneDelta: 1,
      racingDelta: -1,
      html: `
        ${winQuip}
        <div class="mx-card mx-drop-in" style="border-color:rgba(255,215,0,0.4);background:rgba(255,215,0,0.06);text-align:center;padding:20px">
          <div style="margin-bottom:12px">${rpPortrait(winner, 'xl')}</div>
          <div style="font-size:16px;color:#ffd700;font-weight:700;margin-bottom:6px">${winner} crosses the finish line FIRST!</div>
          <div style="margin-top:10px"><span class="mx-status mx-immune" style="font-size:12px;padding:4px 14px">IMMUNITY WINNER</span></div>
        </div>
      `
    });

    // Rest of ranking
    finishRanking.slice(1).forEach((name, i) => {
      const isLast = i === finishRanking.length - 2;
      steps.push({
        type: 'finish-place',
        racingDelta: -1,
        finishedDelta: 1,
        html: `
          <div class="mx-card" style="display:flex;align-items:center;gap:12px;${isLast ? 'border-color:rgba(255,51,51,0.4);background:rgba(255,51,51,0.04)' : ''}">
            ${rpPortrait(name, 'sm')}
            <div style="flex:1">
              <div style="font-size:13px;color:#cdd9e5;font-weight:600">${name}</div>
              <div style="font-size:10px;color:${isLast ? '#ff3333' : '#ff6b00'};margin-top:2px">${isLast ? 'LAST PLACE' : `Finished #${i + 2}`}</div>
            </div>
            <span class="mx-status ${isLast ? 'mx-last' : 'mx-safe'}">${isLast ? 'LAST' : `#${i + 2}`}</span>
          </div>
        `
      });
    });

    // Last place fate
    if (br.phase4.eliminatedPlayer) {
      const elim = br.phase4.eliminatedPlayer;
      steps.push({
        type: 'finish-fate',
        html: `
          ${lastQuip}
          <div class="mx-card" style="border-color:rgba(255,51,51,0.4);background:rgba(255,51,51,0.06);text-align:center;padding:14px">
            ${rpPortrait(elim, 'lg')}
            <div style="font-size:14px;color:#ff3333;font-weight:700;margin-top:8px">
              ${br.isSuddenDeath ? `${elim} finished last — AUTOMATICALLY ELIMINATED!` : `${elim} finished last — a massive target heading into tribal council.`}
            </div>
          </div>
        `
      });
    }
  }

  // ── AFTERMATH ──
  steps.push({ type: 'phase-header', html: `<div class="mx-sector" style="font-size:14px;text-align:center;padding:12px 0;border-top:2px solid rgba(255,107,0,0.3)">💔 THE AFTERMATH</div>` });
  if (br.phase4.eliminationReaction?.beats?.length) {
    steps.push({
      type: 'aftermath-header',
      html: `<div class="mx-sector">THE AFTERMATH</div>`
    });
    br.phase4.eliminationReaction.beats.forEach(beat => {
      steps.push({
        type: 'aftermath-beat',
        html: `
          <div class="mx-card" style="border-color:rgba(255,107,0,0.2)">
            <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${beat}</div>
          </div>
        `
      });
    });
  }

  // ── WRECKAGE REPORT ──
  steps.push({ type: 'phase-header', html: `<div class="mx-sector" style="font-size:14px;text-align:center;padding:12px 0;border-top:2px solid rgba(255,107,0,0.3)">📋 WRECKAGE REPORT — FINAL STATUS</div>` });
  let debriefHtml = `<div class="mx-sector">WRECKAGE REPORT — FINAL STATUS</div>`;
  debriefHtml += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">`;
  br.activePlayers.forEach(name => {
    const badge = br.badges[name];
    const isImmune = badge === 'bikeRaceImmune';
    const isWrecked = (br.phase3.destroyed || []).includes(name);
    const isLast = badge === 'bikeRaceLast';
    const statusClass = isImmune ? 'mx-immune' : isWrecked ? 'mx-wrecked' : isLast ? 'mx-last' : badge === 'bikeRaceBuilder' ? 'mx-safe' : badge === 'bikeRaceSaboteur' ? 'mx-wrecked' : badge === 'bikeRaceClutch' ? 'mx-safe' : 'mx-racing';
    const statusText = isImmune ? 'IMMUNE' : isWrecked ? 'WRECKED' : isLast ? 'LAST' : badge === 'bikeRaceBuilder' ? 'BEST BUILD' : badge === 'bikeRaceSaboteur' ? 'SABOTEUR' : badge === 'bikeRaceClutch' ? 'CLUTCH' : 'FINISHED';
    debriefHtml += `
      <div style="text-align:center;width:80px">
        ${rpPortrait(name, 'sm')}
        <span class="mx-status ${statusClass}" style="margin-top:4px;display:block;font-size:9px">${statusText}</span>
      </div>`;
  });
  debriefHtml += `</div>`;

  if (finishRanking.length) {
    debriefHtml += `<div class="mx-card" style="text-align:center;border-color:rgba(255,215,0,0.3);background:rgba(255,215,0,0.05)">
      <div style="font-size:14px;color:#ffd700;font-weight:700">${finishRanking[0]} wins immunity!</div>
    </div>`;
  }
  steps.push({ type: 'debrief', html: debriefHtml });

  // ── BUILD FINAL HTML ──
  const state = _tvState[stateKey];
  const initialRacing = br.activePlayers.length;
  let html = `<style>${MX_STYLES}</style><div class="mx-page rp-page">
    <div class="mx-header"><div class="mx-header-inner">
      <span style="font-size:10px;letter-spacing:2px;color:#ff6b00">🏁 RACE FEED</span>
      <span style="margin-left:auto;font-size:10px;color:#ff6b00;opacity:0.5">EP ${ep.num}</span>
    </div></div>`;

  html += `<div style="display:flex;gap:16px;justify-content:center;font-size:12px;font-weight:700;letter-spacing:1px;position:sticky;top:0;z-index:3;padding:8px;margin-bottom:12px;background:#1a1008">
    <span style="color:#ff6b00">RACING: <span id="mx-racing-${stateKey}" data-initial="${initialRacing}" style="color:#ff6b00">${initialRacing}</span></span>
    <span style="color:#ff3333">WRECKED: <span id="mx-wrecked-${stateKey}" style="color:#ff3333">0</span></span>
    <span style="color:#ffd700">FINISHED: <span id="mx-finished-${stateKey}" style="color:#ffd700">0</span></span>
  </div>`;

  steps.forEach((step, i) => {
    const visible = i <= state.idx;
    html += `<div id="mx-step-${stateKey}-${i}" data-racing-delta="${step.racingDelta||0}" data-wrecked-delta="${step.wreckedDelta||0}" data-finished-delta="${step.finishedDelta||0}" data-immune-delta="${step.immuneDelta||0}" style="${visible ? '' : 'display:none'}">${step.html}</div>`;
  });

  html += `<div id="mx-controls-${stateKey}"${state.idx >= steps.length - 1 ? ' style="display:none"' : ''}>
    <button class="mx-reveal-btn" id="mx-btn-${stateKey}" onclick="window._mxReveal('${stateKey}', ${steps.length})">▶ NEXT LAP (${state.idx + 2}/${steps.length})</button>
    <button onclick="window._mxRevealAll('${stateKey}', ${steps.length})" style="background:none;border:none;font-size:11px;color:#ff6b00;cursor:pointer;padding:2px 0;letter-spacing:0.3px;opacity:0.7">Reveal all &rsaquo;</button>
  </div>`;

  html += `</div>`;
  return html;
}

export function _mxReveal(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  const nextIdx = state.idx + 1;
  if (nextIdx >= totalSteps) return;
  const el = document.getElementById(`mx-step-${stateKey}-${nextIdx}`);
  if (el) { el.style.display = ''; el.classList.add('mx-scan-in'); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  state.idx = nextIdx;
  // Update status tracker counts
  if (el) {
    const rd = parseInt(el.dataset.racingDelta || '0');
    const wd = parseInt(el.dataset.wreckedDelta || '0');
    const fd = parseInt(el.dataset.finishedDelta || '0');
    if (rd || wd || fd) {
      const rEl = document.getElementById(`mx-racing-${stateKey}`);
      const wEl = document.getElementById(`mx-wrecked-${stateKey}`);
      const fEl = document.getElementById(`mx-finished-${stateKey}`);
      if (rEl && rd) { rEl.textContent = Math.max(0, parseInt(rEl.textContent) + rd); rEl.classList.remove('mx-count-flash'); void rEl.offsetWidth; rEl.classList.add('mx-count-flash'); }
      if (wEl && wd) { wEl.textContent = parseInt(wEl.textContent) + wd; wEl.classList.remove('mx-count-flash'); void wEl.offsetWidth; wEl.classList.add('mx-count-flash'); }
      if (fEl && fd) { fEl.textContent = parseInt(fEl.textContent) + fd; fEl.classList.remove('mx-count-flash'); void fEl.offsetWidth; fEl.classList.add('mx-count-flash'); }
    }
  }
  if (nextIdx >= totalSteps - 1) {
    const controls = document.getElementById(`mx-controls-${stateKey}`);
    if (controls) controls.style.display = 'none';
  } else {
    const btn = document.getElementById(`mx-btn-${stateKey}`);
    if (btn) btn.textContent = `▶ NEXT LAP (${nextIdx + 2}/${totalSteps})`;
  }
}

export function _mxRevealAll(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`mx-step-${stateKey}-${i}`);
    if (el) el.style.display = '';
  }
  _tvState[stateKey].idx = totalSteps - 1;
  const controls = document.getElementById(`mx-controls-${stateKey}`);
  if (controls) controls.style.display = 'none';
  // Set final sidebar counts
  const totalR = parseInt(document.getElementById(`mx-racing-${stateKey}`)?.dataset.initial || '0');
  let r = totalR, w = 0, f = 0;
  for (let i = 0; i < totalSteps; i++) {
    const stepEl = document.getElementById(`mx-step-${stateKey}-${i}`);
    if (stepEl) { r += parseInt(stepEl.dataset.racingDelta || '0'); w += parseInt(stepEl.dataset.wreckedDelta || '0'); f += parseInt(stepEl.dataset.finishedDelta || '0'); }
  }
  const rEl = document.getElementById(`mx-racing-${stateKey}`);
  const wEl = document.getElementById(`mx-wrecked-${stateKey}`);
  const fEl = document.getElementById(`mx-finished-${stateKey}`);
  if (rEl) rEl.textContent = Math.max(0, r);
  if (wEl) wEl.textContent = w;
  if (fEl) fEl.textContent = f;
}

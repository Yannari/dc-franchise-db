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
  q = (q - 5.0) * 1.5 + 5.0; // spread around 5
  // Archetype bonuses
  if (arch === 'challenge-beast') q += 1.5;
  else if (arch === 'mastermind' || arch === 'schemer') q += 1.0;
  else if (arch === 'hothead') q -= 1.0;
  else if (arch === 'goat') q -= 2.0;
  else if (arch === 'wildcard' || arch === 'chaos-agent') q += (Math.random() * 4) - 2.0;
  else if (arch === 'underdog') q += 0.5;
  else if (arch === 'floater') q += 0.3;
  else if (arch === 'perceptive-player') q += 0.5;
  else if (arch === 'social-butterfly') q -= 0.5;
  else if (arch === 'showmancer') {
    const inShowmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players.includes(name));
    if (inShowmance) q -= 0.5;
  }
  q += (Math.random() * 3) - 1.5;
  return Math.max(1, Math.min(10, q));
}

function getBikeName(name) {
  const arch = getArchetype(name) || 'floater';
  const pool = BIKE_NAMES[arch] || BIKE_NAMES['floater'];
  return pool[Math.floor(Math.random() * pool.length)];
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
    const wear = Math.max(0, (10 - race1Scores[rider]) * 2);
    bikeHP[owner] = Math.max(1, bikeHP[owner] - Math.round(wear));
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

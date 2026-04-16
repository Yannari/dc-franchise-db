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

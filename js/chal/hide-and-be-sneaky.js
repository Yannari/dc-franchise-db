// js/chal/hide-and-be-sneaky.js — Hide and Be Sneaky challenge
import { gs, players } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── HIDING SPOT TEMPLATES ──
const HIDING_SPOTS = [
  // Physical-oriented
  { id:'rooftop',       name:'the lodge rooftop',                cat:'physical', indoor:false, statBias:'physical',  risk:0 },
  { id:'treetop',       name:'the top of a tall tree',           cat:'physical', indoor:false, statBias:'physical',  risk:0 },
  { id:'underwater',    name:'underwater near the dock',         cat:'physical', indoor:false, statBias:'endurance', risk:0 },
  { id:'bridge',        name:'hanging from the bridge underside',cat:'physical', indoor:false, statBias:'physical',  risk:0 },
  { id:'climbing-wall', name:'up on the rock climbing wall',     cat:'physical', indoor:false, statBias:'physical',  risk:0 },
  { id:'canoe',         name:'inside a flipped canoe on the beach',cat:'physical',indoor:false,statBias:'endurance', risk:0 },
  // Mental-oriented
  { id:'grass-camo',    name:'under grass camouflage',           cat:'mental',   indoor:false, statBias:'mental',    risk:0 },
  { id:'hollow-log',    name:'inside a hollowed-out log',        cat:'mental',   indoor:false, statBias:'mental',    risk:0 },
  { id:'waterfall',     name:'behind the waterfall curtain',     cat:'mental',   indoor:false, statBias:'mental',    risk:0 },
  { id:'buried-sand',   name:'buried under sand at the beach',   cat:'mental',   indoor:false, statBias:'endurance', risk:0 },
  { id:'totem-pole',    name:'disguised among the totem poles',  cat:'mental',   indoor:false, statBias:'mental',    risk:0 },
  { id:'supply-crate',  name:'inside a supply crate',            cat:'mental',   indoor:true,  statBias:'mental',    risk:0 },
  // Social/stealth-oriented
  { id:'kitchen',       name:"Chef's own kitchen",               cat:'social',   indoor:true,  statBias:'social',    risk:0 },
  { id:'confessional',  name:'behind the confessional outhouse', cat:'social',   indoor:false, statBias:'social',    risk:0 },
  { id:'shower-stalls', name:'inside the communal shower stalls',cat:'social',   indoor:true,  statBias:'social',    risk:0 },
  { id:'dock-stilts',   name:'under the dock in the stilts',     cat:'social',   indoor:false, statBias:'intuition', risk:0 },
  { id:'firepit',       name:'tucked inside the cold campfire pit',cat:'social', indoor:false, statBias:'intuition', risk:0 },
  // Boldness-oriented (high-risk/high-reward)
  { id:'stalker',       name:'stalking Chef Izzy-style',         cat:'boldness', indoor:false, statBias:'boldness',  risk:1 },
  { id:'chris-trailer', name:"inside Chris's private trailer",   cat:'boldness', indoor:true,  statBias:'boldness',  risk:1 },
  { id:'elim-dock',     name:'on the elimination dock itself',   cat:'boldness', indoor:false, statBias:'boldness',  risk:1 },
  { id:'outhouse-roof', name:'perched on the outhouse roof',     cat:'boldness', indoor:false, statBias:'boldness',  risk:1 },
];

// ── EVENT POOLS ──
const DETECTION_EVENTS = [
  { id:'sneeze',         weight:1.0, text: (p, pr) => `${pr.Sub} let out a sneeze that echoed across camp!` },
  { id:'trip-wire',      weight:0.8, text: (p, pr) => `${p} tripped over a loose wire, sending cans clattering!` },
  { id:'animal-skunk',   weight:0.7, text: (p, pr) => `A family of skunks found ${pr.obj} hiding — and sprayed!` },
  { id:'animal-squirrel',weight:0.7, text: (p, pr) => `A squirrel attacked ${pr.obj}, and ${pr.sub} couldn't stay quiet!` },
  { id:'animal-bird',    weight:0.7, text: (p, pr) => `A bird landed on ${pr.posAdj} head and started pecking!` },
  { id:'item-drop',      weight:0.8, text: (p, pr) => `Something fell out of ${pr.posAdj} pocket with a loud clang!` },
  { id:'panic-breath',   weight:0.6, text: (p, pr) => `${pr.Sub} started hyperventilating — the pressure was getting to ${pr.obj}!` },
  { id:'shared-spot',    weight:0.5, text: (a, aPr, b) => `${a} and ${b} found each other at the same spot — their arguing drew attention!` },
  { id:'cramp',          weight:0.6, text: (p, pr) => `${p} got a terrible cramp from staying still too long!` },
  { id:'bug-swarm',      weight:0.7, text: (p, pr) => `A swarm of bugs descended on ${pr.obj} — ${pr.sub} couldn't stop swatting!` },
  { id:'stomach-growl',  weight:0.6, text: (p, pr) => `${pr.PosAdj} stomach growled loud enough for Chef to hear!` },
  { id:'spot-decay',     weight:0.5, text: (p, pr) => `${pr.PosAdj} hiding spot started falling apart — the branch cracked under ${pr.obj}!` },
];

const EVASION_EVENTS = [
  { id:'reposition',     weight:1.0, text: (p, pr) => `${p} sensed Chef approaching and silently relocated!` },
  { id:'distraction',    weight:0.8, text: (p, pr) => `A raccoon knocked over trash cans, drawing Chef away from ${pr.posAdj} area!` },
  { id:'camo-improve',   weight:0.7, text: (p, pr) => `${p} improved ${pr.posAdj} camouflage with nearby materials!` },
  { id:'buddy-system',   weight:0.5, text: (a, aPr, b) => `${a} created a distraction so ${b} could stay hidden!` },
  { id:'perfect-still',  weight:0.6, text: (p, pr) => `${p} achieved perfect stillness — ${pr.sub} was practically invisible!` },
  { id:'env-cover',      weight:0.7, text: (p, pr) => `Falling leaves provided extra cover for ${pr.posAdj} position!` },
  { id:'chef-distracted',weight:0.4, text: () => `Chef stopped to argue with Chris on the walkie-talkie — everyone breathed easier!` },
  { id:'decoy-works',    weight:0.3, text: (p, pr) => `${pr.PosAdj} earlier decoy worked — Chef wasted time searching an empty area!` },
];

const ENVIRONMENTAL_EVENTS = [
  { id:'rain',           weight:0.3, text: () => `Rain started falling — outdoor hiders scrambled, but indoor hiders relaxed!`, persists:true },
  { id:'wind',           weight:0.4, text: () => `A strong wind picked up, rattling the treetops and rooftops!` },
  { id:'chef-decoy',     weight:0.5, text: () => `Chef investigated a suspicious rustling — but it was just a deer!` },
  { id:'power-outage',   weight:0.3, text: () => `The camp power went out — indoor hiders disappeared into darkness!` },
  { id:'stampede',       weight:0.3, text: () => `A group of raccoons stampeded through camp, causing chaos everywhere!` },
  { id:'sunset',         weight:0.2, text: () => `The sun dipped below the trees — shadows stretched across the island!`, persists:true },
  { id:'fog',            weight:0.2, text: () => `A thick fog rolled in from the lake, blanketing the campgrounds!`, persists:true },
  { id:'loudspeaker',    weight:0.4, text: () => `Chris blasted the loudspeaker: "HOW'S EVERYONE DOING?!" — startling every hider!` },
];

const SOCIAL_EVENTS = [
  { id:'spot-another',   weight:0.7, text: (a, aPr, b) => `${a} spotted ${b} from ${aPr.posAdj} hiding place — useful intel for later...` },
  { id:'taunt',          weight:0.4, text: (a, aPr, b) => `${a} taunted ${b}'s general area from the caught pool: "Over there, Chef!"` },
  { id:'solidarity',     weight:0.6, text: (a, aPr, b) => `${a} and ${b} locked eyes from their hiding spots — and stayed silent.` },
  { id:'showmance',      weight:0.5, text: (a, aPr, b) => `${a} whispered comfort to ${b} from a nearby spot — risky, but sweet.` },
  { id:'rivalry',        weight:0.4, text: (a, aPr, b) => `${a} deliberately rustled the bushes near ${b}'s spot!` },
  { id:'caught-cheer',   weight:0.3, text: (a, aPr, b) => `${a} shouted encouragement to ${b} from the caught pool!` },
];

const CHASE_BEATS = [
  { id:'dodge',     text: (p, pr, win) => win ? `${p} ducked under Chef's spray at the last second!` : `Chef's water blast caught ${p} mid-stride!` },
  { id:'obstacle',  text: (p, pr, win) => win ? `${p} vaulted a fallen log without breaking stride!` : `${p} tripped over a log and went sprawling!` },
  { id:'shortcut',  text: (p, pr, win) => win ? `${p} cut through the kitchen — brilliant shortcut!` : `${p} tried a shortcut and hit a dead end!` },
  { id:'last-stand',text: (p, pr, win) => win ? `${p} pulled off an incredible fake-out juke on Chef!` : `Chef cornered ${p} — nowhere left to run!` },
  { id:'combat',    text: (p, pr, win) => win ? `${p} went full Izzy — dropkicked the water gun out of Chef's hands!` : `${p} tried to fight Chef... it didn't go well.` },
  { id:'slide',     text: (p, pr, win) => win ? `${p} dove headfirst and slid into home base!` : `${p} dove for home base but got blasted inches short!` },
  { id:'window',    text: (p, pr, win) => win ? `${p} leapt through a window and landed in a perfect roll!` : `${p} jumped through a window and landed face-first in mud!` },
];

// ── HELPERS ──
function wPick(arr) {
  const total = arr.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of arr) {
    r -= (item.weight || 1);
    if (r <= 0) return item;
  }
  return arr[arr.length - 1];
}

function calcHidingQuality(name, spot) {
  const s = pStats(name);
  let q = s.mental * 0.3 + s.intuition * 0.25 + s.physical * 0.2 + s.social * 0.15 + s.boldness * 0.1;
  if (spot.statBias && s[spot.statBias]) q += s[spot.statBias] * 0.1;
  if (spot.risk) q += s.boldness * 0.15 - 1.0;
  q += (Math.random() * 3) - 1.5;
  return q;
}

function calcObservation(observerName) {
  const s = pStats(observerName);
  return s.intuition * 0.5 + s.mental * 0.3 + (Math.random() * 2 - 1);
}

function calcEscapeScore(name) {
  const s = pStats(name);
  return s.physical * 0.35 + s.boldness * 0.3 + s.endurance * 0.2 + (Math.random() * 3 - 1.5);
}

function calcIntelScore(name) {
  const s = pStats(name);
  return s.intuition * 0.4 + s.mental * 0.3 + s.strategic * 0.3;
}

const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function getArchetype(name) {
  return players.find(p => p.name === name)?.archetype || '';
}
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }
function isNeutralArch(name) { return !isVillainArch(name) && !isNiceArch(name); }
function neutralWouldBetray(name) {
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

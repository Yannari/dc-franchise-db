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

// ══════════════════════════════════════════════════════════════
// SIMULATE
// ══════════════════════════════════════════════════════════════
export function simulateHideAndBeSneaky(ep) {
  const activePlayers = [...gs.activePlayers];
  const n = activePlayers.length;

  // ── PHASE 1: HIDE ──
  const spotAssignments = {};
  const hidingQuality = {};
  const observedBy = {};
  const usedSpots = new Set();

  activePlayers.forEach(name => {
    const s = pStats(name);
    const arch = getArchetype(name);

    let preferredCat = 'mental';
    if (['challenge-beast'].includes(arch)) preferredCat = 'physical';
    if (['schemer', 'mastermind', 'villain'].includes(arch)) preferredCat = 'social';
    if (['wildcard', 'chaos-agent'].includes(arch) && s.boldness >= 6) preferredCat = 'boldness';
    if (['social-butterfly', 'hero'].includes(arch)) preferredCat = 'social';
    if (['underdog', 'floater', 'perceptive-player'].includes(arch)) preferredCat = 'mental';
    if (s.physical >= 8) preferredCat = 'physical';

    // Stalker strategy: wildcards/chaos-agents with high boldness+intuition
    if (['wildcard', 'chaos-agent'].includes(arch) && s.boldness >= 7 && s.intuition >= 6 && Math.random() < 0.4) {
      const stalkerSpot = HIDING_SPOTS.find(sp => sp.id === 'stalker');
      spotAssignments[name] = stalkerSpot;
      hidingQuality[name] = calcHidingQuality(name, stalkerSpot);
      const stalkerCheck = s.boldness * 0.4 + s.intuition * 0.3 + s.physical * 0.3 + (Math.random() * 2 - 1);
      if (stalkerCheck < 6) {
        hidingQuality[name] -= 3;
      } else {
        hidingQuality[name] += 2;
      }
      usedSpots.add('stalker');
      return;
    }

    const available = HIDING_SPOTS.filter(sp => !usedSpots.has(sp.id) && sp.id !== 'stalker');
    const preferred = available.filter(sp => sp.cat === preferredCat);
    const spotPool = preferred.length ? preferred : available;
    const spot = spotPool[Math.floor(Math.random() * spotPool.length)] || available[0];
    spotAssignments[name] = spot;
    usedSpots.add(spot.id);
    hidingQuality[name] = calcHidingQuality(name, spot);

    if (arch === 'underdog') hidingQuality[name] += 1.0;
    if (arch === 'goat') hidingQuality[name] -= 1.0;
    if (arch === 'hothead') hidingQuality[name] -= 0.5;
    if (arch === 'floater') hidingQuality[name] += 0.3;
    if (arch === 'perceptive-player') hidingQuality[name] += 0.5;
    if (arch === 'showmancer') {
      const showmance = (gs.showmances || []).find(sh =>
        sh.phase !== 'broken-up' && sh.players.includes(name) &&
        sh.players.some(p => p !== name && activePlayers.includes(p))
      );
      if (showmance) hidingQuality[name] -= 0.5;
    }
  });

  // Build observable intel
  activePlayers.forEach(observer => {
    observedBy[observer] = {};
    activePlayers.forEach(target => {
      if (target === observer) return;
      observedBy[observer][target] = calcObservation(observer);
    });
    if (['schemer', 'mastermind'].includes(getArchetype(observer))) {
      Object.keys(observedBy[observer]).forEach(t => { observedBy[observer][t] += 1.5; });
    }
    if (getArchetype(observer) === 'hero') {
      Object.keys(observedBy[observer]).forEach(t => { observedBy[observer][t] += 0.5; });
    }
  });

  const phase1 = {
    spots: { ...spotAssignments },
    initialQuality: { ...hidingQuality },
  };

  // ── PHASE 2: HUNT ──
  const totalRounds = Math.ceil(n * 0.7);
  const baseDetection = 4.5;
  const escalation = 0.6;
  let hidden = [...activePlayers];
  const caught = [];
  const escaped = [];
  const rounds = [];
  const persistingEffects = { rain:false, fog:false, sunset:false };
  const badges = {};

  for (let r = 1; r <= totalRounds; r++) {
    if (hidden.length <= 1) break;
    const chefDetection = baseDetection + r * escalation;
    const roundData = { num: r, events: [], found: null, escaped: null, hiddenCount: hidden.length };

    const eventCount = 3 + (Math.random() < 0.5 ? 1 : 0);
    const roundBonuses = {};

    for (let e = 0; e < eventCount; e++) {
      const lateGame = r / totalRounds;
      const catRoll = Math.random();
      let pool;
      if (catRoll < 0.25 + lateGame * 0.15) pool = DETECTION_EVENTS;
      else if (catRoll < 0.5) pool = EVASION_EVENTS;
      else if (catRoll < 0.7) pool = ENVIRONMENTAL_EVENTS;
      else pool = SOCIAL_EVENTS;

      const template = wPick(pool);
      const evt = { id: template.id, type: pool === DETECTION_EVENTS ? 'detection' : pool === EVASION_EVENTS ? 'evasion' : pool === ENVIRONMENTAL_EVENTS ? 'environmental' : 'social' };

      if (pool === ENVIRONMENTAL_EVENTS) {
        evt.text = template.text();
        if (template.persists) persistingEffects[template.id] = true;

        if (template.id === 'rain') {
          hidden.forEach(h => {
            const spot = spotAssignments[h];
            const delta = spot.indoor ? 1.0 : -1.0;
            hidingQuality[h] += delta;
            roundBonuses[h] = (roundBonuses[h] || 0) + delta;
          });
        } else if (template.id === 'wind') {
          hidden.forEach(h => {
            const spot = spotAssignments[h];
            if (['treetop', 'rooftop', 'outhouse-roof'].includes(spot.id)) {
              const s = pStats(h);
              const physCheck = s.physical + (Math.random() * 2 - 1);
              const delta = physCheck >= 6 ? -0.5 : -1.5;
              hidingQuality[h] += delta;
              roundBonuses[h] = (roundBonuses[h] || 0) + delta;
            }
          });
        } else if (template.id === 'power-outage') {
          hidden.forEach(h => {
            if (spotAssignments[h].indoor) {
              hidingQuality[h] += 1.5;
              roundBonuses[h] = (roundBonuses[h] || 0) + 1.5;
            }
          });
        } else if (template.id === 'chef-decoy') {
          hidden.forEach(h => {
            hidingQuality[h] += 0.5;
            roundBonuses[h] = (roundBonuses[h] || 0) + 0.5;
          });
        } else if (template.id === 'stampede') {
          hidden.forEach(h => {
            hidingQuality[h] -= 1.0;
            roundBonuses[h] = (roundBonuses[h] || 0) - 1.0;
          });
        } else if (template.id === 'sunset' || template.id === 'fog') {
          hidden.forEach(h => {
            hidingQuality[h] += 1.0;
            roundBonuses[h] = (roundBonuses[h] || 0) + 1.0;
          });
        } else if (template.id === 'loudspeaker') {
          hidden.forEach(h => {
            hidingQuality[h] -= 0.5;
            roundBonuses[h] = (roundBonuses[h] || 0) - 0.5;
          });
        }
        evt.targets = [...hidden];
      } else if (pool === SOCIAL_EVENTS) {
        if (template.id === 'taunt' || template.id === 'caught-cheer') {
          if (!caught.length || !hidden.length) continue;
          const caughtP = caught[Math.floor(Math.random() * caught.length)].name;
          const cPr = pronouns(caughtP);
          const sorted = [...hidden].sort((a, b) =>
            template.id === 'taunt' ? getBond(caughtP, a) - getBond(caughtP, b) : getBond(caughtP, b) - getBond(caughtP, a)
          );
          const target = sorted[0];
          evt.text = template.text(caughtP, cPr, target);
          evt.targets = [caughtP, target];

          if (template.id === 'taunt') {
            hidingQuality[target] -= 1.5;
            roundBonuses[target] = (roundBonuses[target] || 0) - 1.5;
            addBond(caughtP, target, -1);
          } else {
            hidingQuality[target] += 0.5;
            hidingQuality[target] -= 1.0;
            roundBonuses[target] = (roundBonuses[target] || 0) - 0.5;
            addBond(caughtP, target, 1);
          }
        } else {
          if (hidden.length < 2) continue;
          let a, b;
          if (template.id === 'showmance') {
            const sh = (gs.showmances || []).find(s =>
              s.phase !== 'broken-up' && s.players.every(p => hidden.includes(p))
            );
            if (!sh) continue;
            [a, b] = sh.players;
          } else if (template.id === 'rivalry') {
            let worstBond = Infinity, bestPair = null;
            for (let i = 0; i < hidden.length; i++) {
              for (let j = i + 1; j < hidden.length; j++) {
                const bond = getBond(hidden[i], hidden[j]);
                if (bond < worstBond) { worstBond = bond; bestPair = [hidden[i], hidden[j]]; }
              }
            }
            if (!bestPair || worstBond >= 0) continue;
            [a, b] = bestPair;
          } else {
            const shuffled = [...hidden].sort(() => Math.random() - 0.5);
            a = shuffled[0]; b = shuffled[1];
          }
          const aPr = pronouns(a);
          evt.text = template.text(a, aPr, b);
          evt.targets = [a, b];

          if (template.id === 'solidarity') {
            hidingQuality[a] += 0.5; hidingQuality[b] += 0.5;
            roundBonuses[a] = (roundBonuses[a] || 0) + 0.5;
            roundBonuses[b] = (roundBonuses[b] || 0) + 0.5;
            addBond(a, b, 1);
          } else if (template.id === 'showmance') {
            hidingQuality[a] -= 0.5; hidingQuality[b] -= 0.5;
            roundBonuses[a] = (roundBonuses[a] || 0) - 0.5;
            roundBonuses[b] = (roundBonuses[b] || 0) - 0.5;
            addBond(a, b, 1);
          } else if (template.id === 'rivalry') {
            if (isVillainArch(a)) {
              hidingQuality[b] -= 1.5;
              roundBonuses[b] = (roundBonuses[b] || 0) - 1.5;
              addBond(a, b, -2);
            } else if (isVillainArch(b)) {
              hidingQuality[a] -= 1.5;
              roundBonuses[a] = (roundBonuses[a] || 0) - 1.5;
              addBond(b, a, -2);
            }
          } else if (template.id === 'spot-another') {
            if (observedBy[a]) observedBy[a][b] = (observedBy[a][b] || 0) + 2.0;
          }
        }
      } else {
        if (template.id === 'shared-spot' || template.id === 'buddy-system') {
          if (hidden.length < 2) continue;
          const shuffled = [...hidden].sort(() => Math.random() - 0.5);
          const a = shuffled[0], b = shuffled[1];
          const aPr = pronouns(a);
          evt.text = template.text(a, aPr, b);
          evt.targets = [a, b];
          if (template.id === 'shared-spot') {
            hidingQuality[a] -= 1.5; hidingQuality[b] -= 1.5;
            roundBonuses[a] = (roundBonuses[a] || 0) - 1.5;
            roundBonuses[b] = (roundBonuses[b] || 0) - 1.5;
          } else {
            hidingQuality[a] -= 1.0; hidingQuality[b] += 2.0;
            roundBonuses[a] = (roundBonuses[a] || 0) - 1.0;
            roundBonuses[b] = (roundBonuses[b] || 0) + 2.0;
            addBond(a, b, 1);
          }
        } else {
          const target = hidden[Math.floor(Math.random() * hidden.length)];
          const tPr = pronouns(target);
          evt.text = template.text(target, tPr);
          evt.targets = [target];

          let delta = 0;
          if (pool === DETECTION_EVENTS) {
            if (template.id === 'trip-wire') delta = -2.0;
            else if (template.id === 'animal-skunk') delta = -2.5;
            else if (template.id === 'animal-squirrel' || template.id === 'animal-bird') delta = -1.5;
            else if (template.id === 'panic-breath') {
              delta = pStats(target).boldness >= 6 ? -0.5 : -1.5;
            } else if (template.id === 'spot-decay') delta = -1.5;
            else if (template.id === 'cramp') {
              delta = pStats(target).physical >= 6 ? -0.5 : -1.0;
            } else delta = -1.0;
          } else {
            if (template.id === 'reposition') {
              delta = pStats(target).intuition >= 5 ? 1.5 : 0.5;
            } else if (template.id === 'camo-improve') {
              delta = pStats(target).mental >= 6 ? 1.5 : 0.5;
            } else if (template.id === 'perfect-still') {
              delta = pStats(target).mental >= 6 && pStats(target).intuition >= 6 ? 1.5 : 0.5;
            } else if (template.id === 'decoy-works') {
              delta = pStats(target).mental >= 7 ? 1.5 : 0.5;
            } else if (template.id === 'chef-distracted') {
              hidden.forEach(h => {
                hidingQuality[h] += 0.5;
                roundBonuses[h] = (roundBonuses[h] || 0) + 0.5;
              });
              delta = 0;
            } else delta = 1.0;
          }
          hidingQuality[target] += delta;
          roundBonuses[target] = (roundBonuses[target] || 0) + delta;
          evt.delta = delta;
        }
      }
      roundData.events.push(evt);
    }

    // Persisting effects
    if (persistingEffects.rain) {
      hidden.forEach(h => {
        const spot = spotAssignments[h];
        hidingQuality[h] += spot.indoor ? 0.3 : -0.3;
      });
    }
    if (persistingEffects.fog || persistingEffects.sunset) {
      hidden.forEach(h => { hidingQuality[h] += 0.2; });
    }

    // Detection: find lowest quality hider
    const sortedByQuality = [...hidden].sort((a, b) => hidingQuality[a] - hidingQuality[b]);
    const weakest = sortedByQuality[0];
    const weakestQ = hidingQuality[weakest];

    if (weakestQ < chefDetection) {
      const escScore = calcEscapeScore(weakest);
      const sprayAccuracy = 5 + r * 0.3;
      const didEscape = escScore > sprayAccuracy && Math.random() < 0.18;

      if (didEscape) {
        escaped.push({ name: weakest, round: r });
        roundData.escaped = { name: weakest, escapeScore: escScore };
        badges[weakest] = 'hideSeekClutch';
        popDelta(weakest, 2);
      } else {
        caught.push({ name: weakest, round: r, method: 'found', escapeAttempted: true });
        roundData.found = { name: weakest, escaped: false };
        const lastEvt = roundData.events.find(e => e.targets?.includes(weakest) && e.type === 'detection');
        if (lastEvt && ['animal-skunk', 'sneeze', 'stomach-growl', 'bug-swarm'].includes(lastEvt.id)) {
          badges[weakest] = 'hideSeekFlush';
          popDelta(weakest, -1);
        }
      }
      hidden = hidden.filter(h => h !== weakest);
    } else {
      roundData.found = null;
    }

    roundData.hiddenAfter = hidden.length;
    rounds.push(roundData);
  }

  const phase2 = { rounds, caught: [...caught], escaped: [...escaped] };

  // ── PHASE 3: BETRAYAL ──
  const betrayals = [];
  const loyals = [];

  caught.forEach(({ name }) => {
    let willing = false;

    if (isVillainArch(name)) {
      willing = true;
    } else if (isNiceArch(name)) {
      willing = false;
      loyals.push(name);
      popDelta(name, 1);
    } else if (isNeutralArch(name)) {
      willing = neutralWouldBetray(name);
      if (!willing) loyals.push(name);
    }

    if (willing && hidden.length > 0) {
      const target = [...hidden].sort((a, b) => getBond(name, a) - getBond(name, b))[0];
      const intel = calcIntelScore(name);
      const observationData = observedBy[name]?.[target] || 0;
      const effectiveIntel = intel * 0.6 + observationData * 0.4;

      let penalty;
      if (effectiveIntel > 7) penalty = 3.0;
      else if (effectiveIntel > 4) penalty = 1.5;
      else penalty = 0.5;

      hidingQuality[target] -= penalty;

      const bondDmg = -(2 + Math.floor(penalty));
      addBond(name, target, bondDmg);

      const targetLikability = (gs.popularity?.[target] || 0);
      let popHit = targetLikability > 0 ? -Math.min(3, Math.ceil(targetLikability / 2)) : -1;
      if (isVillainArch(name)) popHit = Math.ceil(popHit / 2);
      popDelta(name, popHit);

      betrayals.push({
        betrayer: name, target, intelQuality: effectiveIntel > 7 ? 'high' : effectiveIntel > 4 ? 'medium' : 'low',
        penalty, targetFound: false,
      });

      badges[name] = 'hideSeekTracker';

      hidden.forEach(h => {
        if (h === target) return;
        const s = pStats(h);
        if (s.intuition >= 7 && Math.random() < 0.4) {
          addBond(h, name, -1);
        }
      });
    }
  });

  loyals.forEach(l => {
    hidden.forEach(h => { addBond(l, h, 1); });
    badges[l] = badges[l] || 'hideSeekLoyal';
  });

  const phase3 = { betrayals: [...betrayals], loyals: [...loyals] };

  // ── PHASE 4: ESCAPE (fight-or-flight) ──
  const escapeAttempts = [];
  const dangerThreshold = baseDetection + totalRounds * escalation - 1.5;

  const atRisk = hidden.filter(h => hidingQuality[h] < dangerThreshold);

  atRisk.forEach(name => {
    const s = pStats(name);
    const arch = getArchetype(name);

    let runsForIt = false;
    if (s.boldness >= 7 && s.physical >= 6) runsForIt = true;
    else if (s.mental >= 7 && hidingQuality[name] >= dangerThreshold - 1) runsForIt = false;
    else if (s.boldness <= 4) runsForIt = false;
    else if (arch === 'challenge-beast') runsForIt = true;
    else if (arch === 'mastermind') runsForIt = false;
    else if (arch === 'wildcard') runsForIt = Math.random() < 0.5;
    else runsForIt = s.physical + s.boldness > s.mental + s.intuition;

    if (runsForIt) {
      const escScore = calcEscapeScore(name);
      const sprayAcc = 5 + totalRounds * 0.3 + (1 / Math.max(1, hidden.length));
      const success = escScore > sprayAcc;

      const beatCount = 2 + (Math.random() < 0.4 ? 1 : 0);
      const beats = [];
      const availBeats = [...CHASE_BEATS].sort(() => Math.random() - 0.5);
      for (let i = 0; i < beatCount && i < availBeats.length; i++) {
        const bt = availBeats[i];
        const pr = pronouns(name);
        const isLastBeat = i === beatCount - 1;
        const beatWin = isLastBeat ? success : Math.random() < 0.6;
        beats.push({ id: bt.id, text: bt.text(name, pr, beatWin), win: beatWin });
      }

      if (success) {
        escaped.push({ name, round: 'phase4' });
        badges[name] = 'hideSeekClutch';
        popDelta(name, 2);
      } else {
        caught.push({ name, round: 'phase4', method: 'escape-fail', escapeAttempted: true });
      }
      hidden = hidden.filter(h => h !== name);
      escapeAttempts.push({ name, decision: 'run', beats, success });
    } else {
      const survivalChance = hidingQuality[name] / dangerThreshold;
      const survived = Math.random() < Math.min(0.8, survivalChance);
      if (!survived) {
        caught.push({ name, round: 'phase4', method: 'found', escapeAttempted: false });
        hidden = hidden.filter(h => h !== name);
      } else {
        hidingQuality[name] += 1.0;
      }
      escapeAttempts.push({ name, decision: 'stay', beats: [], success: survived });
    }
  });

  const phase4 = { attempts: escapeAttempts, safeHiders: hidden.filter(h => !atRisk.includes(h)) };

  // ── PHASE 5: SHOWDOWN (cat-and-mouse chase) ──
  let showdown = null;
  let immunityWinners = [...escaped.map(e => e.name)];

  if (hidden.length === 1) {
    immunityWinners.push(hidden[0]);
    badges[hidden[0]] = 'hideSeekImmune';
    popDelta(hidden[0], 2);
  } else if (hidden.length >= 2) {
    const chaseResults = {};
    const showdownBeats = {};

    hidden.forEach(name => {
      const s = pStats(name);
      let totalScore = 0;
      const beats = [];
      const beatCount = 3 + (Math.random() < 0.3 ? 1 : 0);
      const availBeats = [...CHASE_BEATS].sort(() => Math.random() - 0.5);

      for (let i = 0; i < beatCount && i < availBeats.length; i++) {
        const bt = availBeats[i];
        let beatScore;
        if (bt.id === 'dodge') beatScore = s.physical * 0.3 + s.intuition * 0.3 + s.boldness * 0.2 + (Math.random() * 2 - 1);
        else if (bt.id === 'obstacle') beatScore = s.physical * 0.4 + s.boldness * 0.3 + (Math.random() * 2 - 1);
        else if (bt.id === 'shortcut') beatScore = s.mental * 0.3 + s.boldness * 0.4 + (Math.random() * 2 - 1);
        else if (bt.id === 'last-stand' || bt.id === 'combat') beatScore = s.boldness * 0.4 + s.physical * 0.3 + s.social * 0.15 + (Math.random() * 2 - 1);
        else beatScore = s.physical * 0.3 + s.boldness * 0.3 + (Math.random() * 2 - 1);

        const beatWin = beatScore >= 4.5;
        totalScore += beatWin ? beatScore : -1;

        const pr = pronouns(name);
        beats.push({ id: bt.id, text: bt.text(name, pr, beatWin), win: beatWin, score: beatScore });
      }

      caught.forEach(({ name: caughtP }) => {
        const bond = getBond(caughtP, name);
        if (bond >= 3 && Math.random() < 0.3) {
          totalScore += 1.5;
          addBond(caughtP, name, 2);
          beats.push({ id:'interference', text: `${caughtP} "accidentally" tripped Chef, buying ${name} precious seconds!`, win: true, score: 1.5 });
        } else if (bond <= -3 && Math.random() < 0.3) {
          totalScore -= 1.5;
          addBond(caughtP, name, -2);
          beats.push({ id:'interference', text: `${caughtP} pointed Chef right at ${name}!`, win: false, score: -1.5 });
        }
      });

      const showmance = (gs.showmances || []).find(sh =>
        sh.phase !== 'broken-up' && sh.players.includes(name) &&
        sh.players.some(p => p !== name && hidden.includes(p))
      );
      if (showmance) {
        const partner = showmance.players.find(p => p !== name);
        if (pStats(name).loyalty >= 7 && Math.random() < 0.3) {
          totalScore -= 3;
          chaseResults[partner] = (chaseResults[partner] || 0) + 3;
          addBond(name, partner, 3);
          popDelta(name, 3);
          beats.push({ id:'sacrifice', text: `${name} drew Chef's fire to protect ${partner} — a heroic sacrifice!`, win: false, score: -3 });
        }
      }

      hidden.forEach(rival => {
        if (rival === name) return;
        if (getBond(name, rival) <= -4 && Math.random() < 0.25) {
          totalScore -= 0.5;
          chaseResults[rival] = (chaseResults[rival] || 0) - 1.5;
          addBond(name, rival, -2);
          beats.push({ id:'rivalry', text: `${name} shoved ${rival} into Chef's path!`, win: false, score: -0.5 });
        }
      });

      chaseResults[name] = (chaseResults[name] || 0) + totalScore;
      showdownBeats[name] = beats;
    });

    const showdownRanking = Object.entries(chaseResults).sort(([,a], [,b]) => b - a);
    const winner = showdownRanking[0][0];
    immunityWinners.push(winner);
    badges[winner] = 'hideSeekImmune';
    popDelta(winner, 2);

    const winnerBeats = showdownBeats[winner];
    if (winnerBeats.some(b => b.id === 'combat' && b.win)) {
      popDelta(winner, 2);
    }

    showdown = {
      participants: [...hidden],
      results: chaseResults,
      ranking: showdownRanking.map(([name, score]) => ({ name, score })),
      beats: showdownBeats,
      winner,
    };
  }

  // Stalker badge
  activePlayers.forEach(name => {
    if (spotAssignments[name]?.id === 'stalker') {
      if (immunityWinners.includes(name) || hidden.includes(name)) {
        badges[name] = 'hideSeekStalker';
        popDelta(name, 2);
      } else {
        badges[name] = badges[name] || 'hideSeekStalker';
        popDelta(name, -1);
      }
    }
  });

  const phase5 = showdown;

  // ── RESULTS ──
  if (immunityWinners.length > 2) immunityWinners = immunityWinners.slice(0, 2);
  if (immunityWinners.length === 0 && hidden.length === 1) {
    immunityWinners.push(hidden[0]);
    badges[hidden[0]] = 'hideSeekImmune';
  }

  betrayals.forEach(b => {
    if (caught.some(c => c.name === b.target)) b.targetFound = true;
  });

  if (!gs._hideSeekHeat) gs._hideSeekHeat = {};
  betrayals.forEach(b => {
    gs._hideSeekHeat[b.target] = {
      target: b.betrayer,
      amount: b.penalty * 1.5,
      expiresEp: (gs.episode || 0) + 4,
    };
  });

  const primaryWinner = immunityWinners[0] || null;
  ep.immunityWinner = primaryWinner;
  if (immunityWinners.length > 1) {
    ep.extraImmune = [...new Set([...(ep.extraImmune || []), ...immunityWinners.slice(1)])];
  }
  ep.challengeType = 'individual';
  ep.challengeLabel = 'Hide and Be Sneaky';
  ep.challengeCategory = 'mixed';
  ep.challengeDesc = 'An extreme hide-and-seek game with a water gun-wielding Chef Hatchet.';
  ep.tribalPlayers = gs.activePlayers.filter(p => !immunityWinners.includes(p) && p !== gs.exileDuelPlayer);

  immunityWinners.forEach(w => updateChalRecord(w, 'win'));
  if (caught.length) {
    updateChalRecord(caught[0].name, 'loss');
  }

  ep.hideAndBeSneaky = {
    phase1,
    phase2,
    phase3,
    phase4,
    phase5,
    immunityWinners,
    badges,
    spotAssignments,
    hidingQuality,
    activePlayers,
  };
}

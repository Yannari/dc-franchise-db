// js/chal/full-metal-drama.js — Full Metal Drama war challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── HELPERS ──
const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }
function neutralCanScheme(name) { const s = pStats(name); return s.strategic >= 6 && s.loyalty <= 4; }
function canScheme(name) { return isVillainArch(name) || (!isNiceArch(name) && neutralCanScheme(name)); }

function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

function rng(range = 1) { return (Math.random() - 0.5) * 2 * range; }
function noise(range = 0.25) { return Math.random() * range; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function wPick(arr) {
  const total = arr.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of arr) { r -= (item.weight || 1); if (r <= 0) return item; }
  return arr[arr.length - 1];
}

function addWarHeat(victim, target, amount) {
  if (!gs._warHeat) gs._warHeat = {};
  gs._warHeat[victim] = { target, amount, expiresEp: (gs.episode || 0) + 4 };
}

const host = () => seasonConfig.host || 'Chris';

// ══════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════

const WAR_HOST = {
  planeIntro: [
    (h) => `"Welcome to FULL METAL DRAMA!" ${h} stood on the airstrip, aviators gleaming. "Today... is WAR."`,
    (h) => `${h} slapped the side of a rusty cargo plane. "Get in, soldiers. We're going up."`,
    (h) => `"Three phases. One winner. Maximum carnage." ${h} grinned. "My favorite kind of challenge."`,
  ],
  jumpReaction: [
    (h, p) => `"${p} is OUT of the plane!" ${h} cackled into the megaphone.`,
    (h, p) => `${h} leaned out the door. "That's gotta hurt, ${p}!"`,
    (h, p) => `"Beautiful form!" ${h} was being sarcastic. "${p} looks like a falling sack of potatoes."`,
  ],
  paintBombIntro: [
    (h) => `"Phase two! Time to build your PAINT BOMBS." ${h} gestured at tables of ingredients. "Bigger boom = more points."`,
    (h) => `${h} kicked a bucket of neon paint. "Make. It. EXPLODE."`,
    (h) => `"Art through DESTRUCTION. My two favorite things." ${h} tossed each tribe a detonator.`,
  ],
  explosionJudge: [
    (h, tribe, controlled) => controlled ? `${h} nodded approvingly. "${tribe}'s explosion was... *chef's kiss*. Controlled devastation."` : `"${tribe}'s bomb just... went everywhere. Including on ME." ${h} wiped paint off his face.`,
    (h, tribe, controlled) => controlled ? `"Now THAT'S a proper explosion. Well done, ${tribe}!" — ${h}` : `${h} stared at the wreckage. "${tribe}... what was that."`,
    (h, tribe, controlled) => controlled ? `"Precision detonation from ${tribe}! I'm impressed. Don't tell them." — ${h}` : `"${tribe} just painted half the island. Not in a good way." — ${h}`,
  ],
  flagIntro: [
    (h) => `"CAPTURE. THE. FLAG." ${h}'s eyes were gleaming. "Set your defenses. Storm the enemy base. First flag captured WINS."`,
    (h) => `"This is it. The final battle." ${h} handed each tribe a flag. "Defend yours. Steal theirs."`,
    (h) => `${h} fired a starter pistol. "PHASE THREE — ALL-OUT WAR!"`,
  ],
  setupPhase: [
    (h) => `"You've got three minutes to dig in. I suggest you use them." — ${h}`,
    (h) => `${h} watched the tribes scramble. "I love the panic phase."`,
    (h) => `"Traps, foxholes, sentries — whatever you think will save you." ${h} checked his watch.`,
  ],
  assaultPhase: [
    (h) => `"CHARGE!" ${h} blew a war horn.`,
    (h) => `${h} popped popcorn. "Let the assault begin."`,
    (h) => `"Attackers — GO GO GO!" ${h} waved a checkered flag.`,
  ],
  trapTrigger: [
    (h, p) => `"Oh! ${p} walked RIGHT into that one!" ${h} doubled over laughing.`,
    (h, p) => `${h} winced. "That trap was NASTY. ${p} didn't see it coming."`,
    (h, p) => `"BOOM! ${p} is OUT! Covered in paint!" — ${h}`,
  ],
  capture: [
    (h, p, tribe) => `"${p.toUpperCase()} HAS THE FLAG!" ${h} jumped out of his chair. "${tribe} WINS!"`,
    (h, p, tribe) => `${h} hit the air horn. "${p} captured the flag! ${tribe} takes the war!"`,
    (h, p, tribe) => `"IT'S OVER! ${p} punched through and grabbed the flag for ${tribe}!" — ${h}`,
  ],
  winner: [
    (h, tribe) => `"${tribe} — you have WON the war. ${h} saluted. "The rest of you... see you at tribal."`,
    (h, tribe) => `"${tribe} claims victory! The losers will be voting someone out tonight." — ${h}`,
    (h, tribe) => `${h} draped a military sash over ${tribe}'s flag. "Warriors. All of you. Well, most of you."`,
  ],
};

const WAR_JUMP_EVENTS = {
  heroicDive: [
    (p, pr) => `${p} LAUNCHED ${pr.ref} out of the plane with a war cry — arms spread, zero hesitation!`,
    (p, pr) => `${p} did a backflip off the ramp! Pure showmanship as ${pr.sub} plummeted toward the zone.`,
    (p, pr) => `${pr.Sub} was the first one out. Fearless dive. The others watched in awe.`,
  ],
  panicRefusal: [
    (p, pr) => `${p} grabbed the doorframe with both hands. "I'M NOT JUMPING!" Chef had to pry ${pr.posAdj} fingers loose.`,
    (p, pr) => `${p} looked down and went white. "Nope. Nope nope nope." Someone pushed ${pr.obj}.`,
    (p, pr) => `${p} sat down in the plane and crossed ${pr.posAdj} arms. "Make me." Chef made ${pr.obj}.`,
  ],
  tandemJump: [
    (p1, p2, pr1) => `${p1} grabbed ${p2}'s hand — "TOGETHER!" They jumped as a pair, screaming the whole way down.`,
    (p1, p2, pr1) => `${p1} and ${p2} locked arms and dove. ${pr1.Sub} was laughing. ${p2} was NOT.`,
    (p1, p2, pr1) => `"I've got you!" ${p1} pulled ${p2} off the edge. They fell tangled together.`,
  ],
  cornedBeefLure: [
    (p, pr) => `Chef dangled a can of corned beef hash out the door. ${p} lunged for it — and fell right out.`,
    (p, pr) => `"Is that... FOOD?!" ${p} forgot about the height. Chef grinned and kicked ${pr.obj} out.`,
    (p, pr) => `The smell of Chef's corned beef wafted from below. ${p}'s stomach made the decision for ${pr.obj}.`,
  ],
  midAirConflict: [
    (p1, p2, pr1) => `${p1} shoved ${p2} mid-jump — they tumbled through the air trading slaps!`,
    (p1, p2, pr1) => `${p1} and ${p2} collided in freefall. Punches were thrown. At 10,000 feet.`,
    (p1, p2, pr1) => `"This is YOUR fault!" ${p1} grabbed ${p2}'s ankle. Both spiraled out of control.`,
  ],
};

const WAR_PAINT_EVENTS = {
  sabotageIngredient: [
    (p, pr, target) => `${p} poured sand into ${target}'s paint mixture when nobody was looking.`,
    (p, pr, target) => `${p} swapped ${target}'s detonator cap for a dud. ${pr.Sub} smirked and walked away.`,
    (p, pr, target) => `While ${target}'s tribe argued, ${p} diluted their paint concentrate with water.`,
  ],
  accidentalMasterpiece: [
    (p, pr) => `${p} tripped over a bucket and somehow mixed the PERFECT ratio. Pure luck.`,
    (p, pr) => `"Wait, was I supposed to add THAT?" ${p} accidentally created an insane compound.`,
    (p, pr) => `${p}'s clumsy mixing produced colors nobody had seen before. Accidental genius.`,
  ],
  chainReaction: [
    (p, pr) => `${p} added too much accelerant — BOOM! A premature mini-explosion rocked the table!`,
    (p, pr) => `${p}'s mixture bubbled over and ignited a chain of small pops across the workstation.`,
    (p, pr) => `"DUCK!" ${p}'s volatile mix set off a cascade. Spectacular, but dangerous.`,
  ],
  dudFuse: [
    (p, pr) => `${p} wired the fuse wrong. Click... click... nothing. "${pr.Sub} stared at the detonator, baffled.`,
    (p, pr) => `${p}'s detonator fizzled out. A sad whimper instead of a boom.`,
    (p, pr) => `The fuse ${p} built went dead halfway. ${pr.Sub} kicked it in frustration.`,
  ],
  explosivoMoment: [
    (p, pr) => `${p} poured EVERYTHING in. "MORE PAINT! MORE POWDER! MORE!!!" Total chaos.`,
    (p, pr) => `${p} went full demolition expert. The bomb was beautiful. And completely uncontrollable.`,
    (p, pr) => `"Why aim when you can COVER THE ENTIRE ZONE?!" ${p} maxed out the payload.`,
  ],
  artisticTouch: [
    (p, pr) => `${p} carefully arranged the paint layers for maximum aesthetic impact. Form AND function.`,
    (p, pr) => `${p} treated the bomb like a canvas. Color theory applied to explosions.`,
    (p, pr) => `"Art is about intention." ${p} precisely calibrated the spray pattern.`,
  ],
  leadershipClash: [
    (p1, p2) => `"I'M in charge of the fuse!" "No, I AM!" ${p1} and ${p2} fought over the detonator.`,
    (p1, p2) => `${p1} wanted precision. ${p2} wanted spectacle. Neither would budge.`,
    (p1, p2) => `${p1} and ${p2} spent more time arguing about strategy than actually building.`,
  ],
};

const WAR_FLAG_EVENTS = {
  boobyTrapTrigger: [
    (p, pr) => `SPLAT! ${p} stepped on a paint mine — ${pr.sub} was DRENCHED in neon green!`,
    (p, pr) => `A tripwire caught ${p}'s ankle. A bucket of paint dumped straight on ${pr.posAdj} head.`,
    (p, pr) => `${p} triggered a hidden paint launcher. Direct hit. ${pr.Sub} was eliminated from the round.`,
  ],
  flankingManeuver: [
    (p, pr) => `${p} circled wide through the trees and bypassed EVERY trap. Pure tactical genius.`,
    (p, pr) => `${pr.Sub} read the defense layout and found the gap. ${p} slipped through undetected.`,
    (p, pr) => `"They never covered the left side." ${p} flanked the entire defense.`,
  ],
  smokescreen: [
    (p, pr) => `${p} popped a smoke canister — the attackers advanced under thick cover!`,
    (p, pr) => `${pr.Sub} deployed smoke. The defenders couldn't see a thing.`,
    (p, pr) => `${p} kicked up a dust cloud. "NOW! GO GO GO!" The attack wave surged forward.`,
  ],
  numYoAttack: [
    (p, pr, def) => `${p} went full martial arts on ${def} — spinning kick! The defender went DOWN.`,
    (p, pr, def) => `${p} pulled some kind of karate move on ${def}. Where did THAT come from?!`,
    (p, pr, def) => `${pr.Sub} Bruce Lee'd ${def} right out of the foxhole. "${p} rules!"`,
  ],
  flagRunner: [
    (p, pr) => `${p} broke into a dead sprint — pure speed, straight at the flag!`,
    (p, pr) => `${pr.Sub} saw the opening and BOLTED. ${p} was a blur heading for the enemy base.`,
    (p, pr) => `"GO ${p.toUpperCase()} GO!" ${pr.Sub} was the fastest thing on the battlefield.`,
  ],
  friendlyFire: [
    (p1, p2, pr1) => `${p1} lobbed a paint balloon and nailed ${p2} — ${pr1.posAdj} own teammate!`,
    (p1, p2, pr1) => `"WAIT THAT'S ${p2}!" Too late. ${p1}'s paint grenade already hit.`,
    (p1, p2, pr1) => `In the chaos, ${p1} tackled ${p2}. "Oh no. That's... that's my tribe."`,
  ],
  lastStand: [
    (p, pr) => `${p} was the last defender standing — ${pr.sub} planted ${pr.posAdj} feet and refused to move!`,
    (p, pr) => `One defender. Three attackers. ${p} didn't flinch. "Come and get it."`,
    (p, pr) => `${pr.Sub} turned the foxhole into a fortress. ${p} held the line ALONE.`,
  ],
  rallyCry: [
    (p, pr) => `"FOR THE TRIBE!" ${p}'s battle cry fired up every attacker!`,
    (p, pr) => `${p} rallied the squad. "We're taking that flag — TOGETHER!" Morale surged.`,
    (p, pr) => `${pr.Sub} screamed at the top of ${pr.posAdj} lungs. The entire attack force pushed harder.`,
  ],
  surrenderBluff: [
    (p, pr, def) => `${p} raised ${pr.posAdj} hands. "I give up!" ${def} lowered their guard — ${p} STRUCK.`,
    (p, pr, def) => `"Peace! Peace!" ${p} walked forward with hands up. Then grabbed ${def}'s flag pole.`,
    (p, pr, def) => `${pr.Sub} faked surrender. The moment ${def} relaxed, ${p} launched a counter-attack.`,
  ],
};

const WAR_DRAMA_EVENTS = [
  {
    id: 'leadershipClash', weight: 1.2,
    check: (tribe) => { const highs = tribe.members.filter(n => pStats(n).strategic >= 6); return highs.length >= 2 ? highs.slice(0, 2) : null; },
    apply: (p1, p2) => {
      addBond(p1, p2, -1.5);
      return { text: `${p1} and ${p2} butted heads over the war plan. Neither would back down.`, players: [p1, p2], badgeText: 'LEADERSHIP CLASH', badgeClass: 'red' };
    }
  },
  {
    id: 'insubordination', weight: 1.0,
    check: (tribe) => { const rebels = tribe.members.filter(n => pStats(n).temperament <= 3 && pStats(n).boldness >= 6); return rebels.length ? [rebels[0]] : null; },
    apply: (p) => {
      popDelta(p, -1);
      return { text: `${p} ignored the tribe's strategy completely. "I do what I want."`, players: [p], badgeText: 'INSUBORDINATION', badgeClass: 'red' };
    }
  },
  {
    id: 'alliancePitch', weight: 0.9,
    check: (tribe) => { const pool = tribe.members.filter(n => pStats(n).strategic >= 5); return pool.length >= 2 ? pool.slice(0, 2) : null; },
    apply: (p1, p2) => {
      addBond(p1, p2, 1.5);
      return { text: `During the lull, ${p1} pulled ${p2} aside. "After this war? You and me. Final three." ${p2} nodded slowly.`, players: [p1, p2], badgeText: 'WAR ALLIANCE', badgeClass: 'blue' };
    }
  },
  {
    id: 'rivalTurnedAlly', weight: 0.7,
    check: (tribe) => {
      for (let i = 0; i < tribe.members.length; i++)
        for (let j = i + 1; j < tribe.members.length; j++)
          if (getBond(tribe.members[i], tribe.members[j]) < -2) return [tribe.members[i], tribe.members[j]];
      return null;
    },
    apply: (p1, p2) => {
      addBond(p1, p2, 2.0);
      return { text: `${p1} and ${p2} fought side by side. For the first time, the hatred faded. Just a little.`, players: [p1, p2], badgeText: 'RIVAL TRUCE', badgeClass: 'green' };
    }
  },
  {
    id: 'desertionThreat', weight: 0.6,
    check: (tribe) => { const d = tribe.members.filter(n => pStats(n).loyalty <= 3 && pStats(n).boldness >= 5); return d.length ? [d[0]] : null; },
    apply: (p) => {
      const pr = pronouns(p);
      addWarHeat(p, p, 1.5);
      popDelta(p, -1);
      return { text: `${p} threatened to throw the challenge. "Why should I risk MY neck?" ${pr.Sub} sat down and crossed ${pr.posAdj} arms.`, players: [p], badgeText: 'DESERTION THREAT', badgeClass: 'red' };
    }
  },
  {
    id: 'warHeroRecognition', weight: 0.8,
    check: (tribe) => { const heroes = tribe.members.filter(n => pStats(n).boldness >= 7); return heroes.length ? [heroes[0]] : null; },
    apply: (p) => {
      popDelta(p, 1);
      addBond(p, pick(players.filter(pl => pl.name !== p).map(pl => pl.name)), 0.5);
      return { text: `Everyone agreed — ${p} was carrying the tribe through this war. Respect earned.`, players: [p], badgeText: 'WAR HERO', badgeClass: 'gold' };
    }
  },
  {
    id: 'strategyArgument', weight: 1.1,
    check: (tribe) => tribe.members.length >= 3 ? tribe.members.slice(0, 2) : null,
    apply: (p1, p2) => {
      addBond(p1, p2, -1.0);
      return { text: `${p1}: "We rush the flag." ${p2}: "We DEFEND first." The argument got loud.`, players: [p1, p2], badgeText: 'STRATEGY CLASH', badgeClass: 'orange' };
    }
  },
  {
    id: 'moraleBoost', weight: 0.9,
    check: (tribe) => { const social = tribe.members.filter(n => pStats(n).social >= 6); return social.length ? [social[0]] : null; },
    apply: (p) => {
      const pr = pronouns(p);
      popDelta(p, 1);
      return { text: `${p} gathered the tribe. "We've GOT this. Every single one of us." ${pr.Sub} made eye contact with each member. Morale surged.`, players: [p], badgeText: 'MORALE BOOST', badgeClass: 'green' };
    }
  },
  {
    id: 'woundedPride', weight: 0.8,
    check: (tribe) => { const hot = tribe.members.filter(n => pStats(n).temperament <= 4 && pStats(n).boldness >= 5); return hot.length ? [hot[0]] : null; },
    apply: (p) => {
      popDelta(p, -1);
      return { text: `${p} was still fuming from Phase 2. "I'll show ALL of you what I can do."`, players: [p], badgeText: 'WOUNDED PRIDE', badgeClass: 'orange' };
    }
  },
  {
    id: 'justinLosingInfluence', weight: 0.5,
    check: (tribe) => {
      const social = tribe.members.filter(n => pStats(n).social >= 7 && getArchetype(n) === 'showmancer');
      return social.length ? [social[0]] : null;
    },
    apply: (p) => {
      const pr = pronouns(p);
      return { text: `${p} tried to charm the tribe into giving ${pr.obj} the easy role. Nobody was buying it anymore.`, players: [p], badgeText: 'CHARM FAIL', badgeClass: 'orange' };
    }
  },
];

// ══════════════════════════════════════════════════════════════
// PHASE 1: PLANE JUMP
// ══════════════════════════════════════════════════════════════
function _simulatePlaneJump(ep, tribeMembers, result) {
  const jumpOrder = {};
  const events = [];
  const allPlayers = tribeMembers.flatMap(t => t.members);

  for (const tribe of tribeMembers) {
    const jumpers = [];
    const refusers = [];

    for (const name of tribe.members) {
      const s = pStats(name);
      const pr = pronouns(name);
      const jumpCheck = s.boldness * 0.06 + s.endurance * 0.03 + noise(0.25);

      if (jumpCheck > 0.35) {
        jumpers.push(name);
        // Heroic dive?
        if (s.boldness >= 7 && Math.random() < 0.4) {
          events.push({ type: 'heroicDive', player: name, text: pick(WAR_JUMP_EVENTS.heroicDive)(name, pr) });
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 3;
          popDelta(name, 1);
        } else {
          events.push({ type: 'jump', player: name, text: pick(WAR_HOST.jumpReaction)(host(), name) });
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
        }
      } else {
        refusers.push(name);
        events.push({ type: 'panicRefusal', player: name, text: pick(WAR_JUMP_EVENTS.panicRefusal)(name, pr) });
      }
    }

    // Tandem jumps (bond-based)
    if (jumpers.length >= 2 && Math.random() < 0.3) {
      let bestPair = null, bestBond = -Infinity;
      for (let i = 0; i < jumpers.length; i++)
        for (let j = i + 1; j < jumpers.length; j++) {
          const b = getBond(jumpers[i], jumpers[j]);
          if (b > bestBond) { bestBond = b; bestPair = [jumpers[i], jumpers[j]]; }
        }
      if (bestPair && bestBond > 0) {
        const pr1 = pronouns(bestPair[0]);
        events.push({ type: 'tandemJump', players: bestPair, text: pick(WAR_JUMP_EVENTS.tandemJump)(bestPair[0], bestPair[1], pr1) });
        addBond(bestPair[0], bestPair[1], 1.0);
      }
    }

    // Corned beef lure for a refuser
    if (refusers.length > 0 && Math.random() < 0.5) {
      const victim = pick(refusers);
      events.push({ type: 'cornedBeefLure', player: victim, text: pick(WAR_JUMP_EVENTS.cornedBeefLure)(victim, pronouns(victim)) });
    }

    // Mid-air conflict (rivals)
    if (jumpers.length >= 2 && Math.random() < 0.25) {
      let worstPair = null, worstBond = Infinity;
      for (let i = 0; i < jumpers.length; i++)
        for (let j = i + 1; j < jumpers.length; j++) {
          const b = getBond(jumpers[i], jumpers[j]);
          if (b < worstBond) { worstBond = b; worstPair = [jumpers[i], jumpers[j]]; }
        }
      if (worstPair && worstBond < 0) {
        events.push({ type: 'midAirConflict', players: worstPair, text: pick(WAR_JUMP_EVENTS.midAirConflict)(worstPair[0], worstPair[1], pronouns(worstPair[0])) });
        addBond(worstPair[0], worstPair[1], -1.0);
      }
    }

    // Jump order: jumpers first, then refusers (pushed)
    jumpOrder[tribe.name] = [...jumpers, ...refusers];
  }

  result.planeJump = { jumpOrder, events };
  result.phases.push('planeJump');
}

// ══════════════════════════════════════════════════════════════
// PHASE 2: PAINT BOMB
// ══════════════════════════════════════════════════════════════
function _simulatePaintBomb(ep, tribeMembers, result) {
  const jumpOrder = result.planeJump?.jumpOrder || {};
  const tribeResults = [];
  let bestScore = -Infinity, winnerTribe = null;

  for (const tribe of tribeMembers) {
    const members = tribe.members;
    const jumpers = new Set(jumpOrder[tribe.name]?.slice(0, Math.ceil(members.length * 0.6)) || []);
    let quality = 0, spectacle = 0;
    const contributions = {};
    const events = [];

    // Each member contributes
    for (const name of members) {
      const s = pStats(name);
      let q = s.mental * 0.04 + s.strategic * 0.03 + noise(0.2);
      let sp = s.boldness * 0.03;
      if (jumpers.has(name)) q += 0.05; // jumper bonus
      contributions[name] = { quality: q, spectacle: sp };
      quality += q;
      spectacle += sp;
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.round(q * 3);
    }

    // Control threshold
    const avgControl = members.reduce((s, n) => s + (pStats(n).mental + pStats(n).temperament), 0) / members.length;
    let control = avgControl * 0.05;
    const avgQuality = quality / members.length;

    // Events: 2-3 per tribe
    const eventCount = 2 + (Math.random() < 0.4 ? 1 : 0);
    const eventPool = [
      { id: 'sabotageIngredient', weight: 0.8, filter: () => members.find(n => canScheme(n)) },
      { id: 'accidentalMasterpiece', weight: 0.7, filter: () => members.find(n => ['goat', 'underdog'].includes(getArchetype(n))) },
      { id: 'chainReaction', weight: 0.9, filter: () => members.find(n => pStats(n).boldness >= 5) },
      { id: 'dudFuse', weight: 0.6, filter: () => members.find(n => pStats(n).physical <= 4) },
      { id: 'explosivoMoment', weight: 0.5, filter: () => members.find(n => ['chaos-agent', 'wildcard'].includes(getArchetype(n))) },
      { id: 'artisticTouch', weight: 0.7, filter: () => members.find(n => ['social-butterfly', 'showmancer'].includes(getArchetype(n))) },
      { id: 'leadershipClash', weight: 0.6, filter: () => { const h = members.filter(n => pStats(n).strategic >= 6); return h.length >= 2 ? h : null; } },
    ];
    const usedEvents = new Set();
    for (let i = 0; i < eventCount; i++) {
      const eligible = eventPool.filter(e => !usedEvents.has(e.id) && e.filter());
      if (!eligible.length) break;
      const chosen = wPick(eligible);
      usedEvents.add(chosen.id);

      const actor = chosen.filter();
      const actorName = Array.isArray(actor) ? actor[0] : actor;
      const pr = pronouns(actorName);

      switch (chosen.id) {
        case 'sabotageIngredient': {
          const otherTribe = tribeMembers.find(t => t.name !== tribe.name);
          if (otherTribe) {
            const target = otherTribe.name;
            events.push({ type: 'sabotageIngredient', player: actorName, text: pick(WAR_PAINT_EVENTS.sabotageIngredient)(actorName, pr, target) });
            quality -= 0.1; control -= 0.1;
            ep.chalMemberScores[actorName] = (ep.chalMemberScores[actorName] || 0) - 2;
            addWarHeat(actorName, actorName, 1.5);
          }
          break;
        }
        case 'accidentalMasterpiece':
          events.push({ type: 'accidentalMasterpiece', player: actorName, text: pick(WAR_PAINT_EVENTS.accidentalMasterpiece)(actorName, pr) });
          quality += 0.15;
          break;
        case 'chainReaction':
          events.push({ type: 'chainReaction', player: actorName, text: pick(WAR_PAINT_EVENTS.chainReaction)(actorName, pr) });
          spectacle += 0.2; control -= 0.15;
          break;
        case 'dudFuse':
          events.push({ type: 'dudFuse', player: actorName, text: pick(WAR_PAINT_EVENTS.dudFuse)(actorName, pr) });
          quality -= 0.1;
          break;
        case 'explosivoMoment':
          events.push({ type: 'explosivoMoment', player: actorName, text: pick(WAR_PAINT_EVENTS.explosivoMoment)(actorName, pr) });
          spectacle = 999; control = 0; // guaranteed uncontrolled
          break;
        case 'artisticTouch':
          events.push({ type: 'artisticTouch', player: actorName, text: pick(WAR_PAINT_EVENTS.artisticTouch)(actorName, pr) });
          quality += 0.1;
          break;
        case 'leadershipClash': {
          const fighters = actor;
          events.push({ type: 'leadershipClash', players: [fighters[0], fighters[1]], text: pick(WAR_PAINT_EVENTS.leadershipClash)(fighters[0], fighters[1]) });
          quality -= 0.05; // both distracted
          addBond(fighters[0], fighters[1], -1.0);
          break;
        }
      }
    }

    const controlled = spectacle <= control * members.length;
    const score = (quality / members.length) * (controlled ? 1.0 : 0.3);

    tribeResults.push({ tribe: tribe.name, quality: avgQuality, spectacle, controlled, score, events, contributions });
    if (score > bestScore) { bestScore = score; winnerTribe = tribe.name; }
  }

  // Host judges each tribe
  for (const tr of tribeResults) {
    tr.hostJudge = pick(WAR_HOST.explosionJudge)(host(), tr.tribe, tr.controlled);
  }

  result.paintBomb = { tribes: tribeResults, winner: winnerTribe };
  result.phases.push('paintBomb');
}

// ══════════════════════════════════════════════════════════════
// DRAMA BREAK
// ══════════════════════════════════════════════════════════════
function _simulateWarDramaBreak(ep, tribeMembers, result) {
  const events = [];
  const campKey = gs.mergeName || gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

  const targetCount = 5 + Math.floor(Math.random() * 3); // 5-7
  const usedIds = new Set();

  for (let i = 0; i < targetCount; i++) {
    // Pick a random tribe for context
    const tribe = pick(tribeMembers);
    const eligible = WAR_DRAMA_EVENTS.filter(e => !usedIds.has(e.id));
    if (!eligible.length) break;

    const chosen = wPick(eligible);
    const actors = chosen.check(tribe);
    if (!actors) continue;
    usedIds.add(chosen.id);

    const campEvent = chosen.apply(...actors);
    events.push({ id: chosen.id, ...campEvent });
    ep.campEvents[campKey].post.push({ ...campEvent, tag: 'full-metal-drama-drama' });
  }

  result.breakEvents = events;
}

// ══════════════════════════════════════════════════════════════
// PHASE 3: CAPTURE THE FLAG
// ══════════════════════════════════════════════════════════════
function _simulateCaptureTheFlag(ep, tribeMembers, result) {
  const paintWinner = result.paintBomb?.winner;
  const setup = [];
  const rounds = [];
  let capturedBy = null, winnerTribe = null;

  // ── 3a: DEFENSE SETUP ──
  const tribeState = {};
  for (const tribe of tribeMembers) {
    const members = tribe.members;
    const attackers = [];
    const defenders = [];
    const foxholes = [];
    const traps = [];
    const sentries = [];

    // Score each member for attack vs defense
    const scored = members.map(name => {
      const s = pStats(name);
      const attackScore = s.boldness * 0.04 + s.physical * 0.03 - s.temperament * 0.03 - s.mental * 0.02;
      return { name, attackScore };
    }).sort((a, b) => b.attackScore - a.attackScore);

    const attackerCount = Math.max(1, Math.round(members.length * 0.6));
    scored.forEach((entry, idx) => {
      if (idx < attackerCount) attackers.push(entry.name);
      else defenders.push(entry.name);
    });

    // Defense plan quality = best strategist
    const planQuality = Math.max(...members.map(n => pStats(n).strategic * 0.06 + pStats(n).mental * 0.04));

    // Defenders set up
    for (const name of defenders) {
      const s = pStats(name);
      // Each defender picks best action
      const foxholeCheck = s.physical * 0.05 + s.endurance * 0.03 + noise();
      const trapCheck = s.strategic * 0.06 + s.mental * 0.04 + noise();
      const sentryCheck = s.intuition * 0.05 + s.boldness * 0.04 + noise();

      const best = Math.max(foxholeCheck, trapCheck, sentryCheck);
      if (best === trapCheck && trapCheck > 0.45) {
        const difficulty = s.strategic * 0.05 + s.mental * 0.04;
        traps.push({ builder: name, difficulty });
      } else if (best === foxholeCheck && foxholeCheck > 0.4) {
        foxholes.push({ builder: name });
      } else if (sentryCheck > 0.4) {
        sentries.push({ builder: name });
      } else {
        foxholes.push({ builder: name }); // fallback: dig in
      }
    }

    // Paint bomb winner gets +1 extra trap
    if (tribe.name === paintWinner) {
      const bestTrapper = [...attackers, ...defenders].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
      if (bestTrapper) {
        traps.push({ builder: bestTrapper, difficulty: pStats(bestTrapper).strategic * 0.05 + pStats(bestTrapper).mental * 0.04, bonus: true });
      }
    }

    const foxholeBonus = foxholes.length > 0 ? 0.1 : 0;
    const sentryBonus = sentries.length > 0 ? 0.05 : 0;

    tribeState[tribe.name] = { attackers: [...attackers], defenders: [...defenders], traps: [...traps], foxholes, sentries, planQuality, foxholeBonus, sentryBonus, activeDefenders: [...defenders], activeAttackers: [...attackers] };
    setup.push({ tribe: tribe.name, foxholes: foxholes.length, traps: traps.length, sentries: sentries.length, planQuality, attackers: attackers.length, defenders: defenders.length });
  }

  // ── 3b: ASSAULT (up to 5 rounds) ──
  for (let round = 1; round <= 5; round++) {
    const roundAttacks = [];
    const roundEvents = [];
    let captured = false;

    for (const tribe of tribeMembers) {
      const myState = tribeState[tribe.name];
      const enemyTribe = tribeMembers.find(t => t.name !== tribe.name);
      if (!enemyTribe) continue;
      const enemyState = tribeState[enemyTribe.name];

      // Each active attacker advances
      const stillActive = [];
      for (const attacker of myState.activeAttackers) {
        const s = pStats(attacker);
        const pr = pronouns(attacker);
        let advanced = false;
        let trapResult = 'none';
        let defenderResult = 'none';

        // TRAP CHECK
        if (enemyState.traps.length > 0) {
          const trap = enemyState.traps[0]; // face outermost trap
          const detect = s.strategic * 0.05 + s.mental * 0.04 + noise(0.2);
          if (detect > trap.difficulty) {
            trapResult = 'dodged';
          } else {
            trapResult = 'hit';
            roundEvents.push({ type: 'boobyTrapTrigger', player: attacker, text: pick(WAR_FLAG_EVENTS.boobyTrapTrigger)(attacker, pr) });
            ep.chalMemberScores[trap.builder] = (ep.chalMemberScores[trap.builder] || 0) + 3;
            roundAttacks.push({ attacker, tribe: tribe.name, trapResult, defenderResult: 'n/a', advanced: false });
            continue; // eliminated this round
          }
        }

        // FLANKING MANEUVER (bypass traps entirely)
        if (trapResult === 'none' && s.intuition * 0.08 > 0.5 + noise(0.1) && Math.random() < 0.2) {
          roundEvents.push({ type: 'flankingManeuver', player: attacker, text: pick(WAR_FLAG_EVENTS.flankingManeuver)(attacker, pr) });
          trapResult = 'flanked';
        }

        // DEFENDER MATCHUP
        if (enemyState.activeDefenders.length > 0) {
          const defender = enemyState.activeDefenders[0];
          const ds = pStats(defender);
          const dpr = pronouns(defender);

          const attackPower = s.physical * 0.04 + s.boldness * 0.03 + s.endurance * 0.02 + noise(0.2);
          const defendPower = ds.physical * 0.03 + ds.strategic * 0.04 + ds.mental * 0.03 + ds.endurance * 0.02 + enemyState.foxholeBonus + enemyState.sentryBonus + noise(0.2);

          // Special events during matchup
          // Num-yo attack
          if (s.physical >= 7 && Math.random() < 0.15) {
            roundEvents.push({ type: 'numYoAttack', player: attacker, text: pick(WAR_FLAG_EVENTS.numYoAttack)(attacker, pr, defender) });
            enemyState.activeDefenders.shift(); // defender disabled
            advanced = true;
            defenderResult = 'stunned';
          }
          // Surrender bluff
          else if (s.strategic >= 7 && Math.random() < 0.12) {
            roundEvents.push({ type: 'surrenderBluff', player: attacker, text: pick(WAR_FLAG_EVENTS.surrenderBluff)(attacker, pr, defender) });
            advanced = true;
            defenderResult = 'bluffed';
          }
          else if (attackPower > defendPower) {
            advanced = true;
            defenderResult = 'overpowered';
            enemyState.activeDefenders.shift();
          } else {
            defenderResult = 'repelled';
            // Last stand check
            if (enemyState.activeDefenders.length === 1 && Math.random() < 0.3) {
              roundEvents.push({ type: 'lastStand', player: defender, text: pick(WAR_FLAG_EVENTS.lastStand)(defender, dpr) });
              popDelta(defender, 2);
              ep.chalMemberScores[defender] = (ep.chalMemberScores[defender] || 0) + 5;
            }
          }
        } else {
          // UNDEFENDED BASE → capture attempt
          advanced = true;
          defenderResult = 'undefended';
        }

        if (advanced) stillActive.push(attacker);
        roundAttacks.push({ attacker, tribe: tribe.name, trapResult, defenderResult, advanced });

        // FLAG CAPTURE CHECK — undefended base
        if (advanced && enemyState.activeDefenders.length === 0) {
          const captureChance = s.physical * 0.06 + s.endurance * 0.04 + noise(0.15);
          if (captureChance > 0.35 || round >= 5) {
            capturedBy = attacker;
            winnerTribe = tribe.name;
            captured = true;
            roundEvents.push({ type: 'flagCapture', player: attacker, text: pick(WAR_HOST.capture)(host(), attacker, tribe.name) });
            ep.chalMemberScores[attacker] = (ep.chalMemberScores[attacker] || 0) + 8;
            popDelta(attacker, 3);
            break;
          }
        }
      }

      myState.activeAttackers = stillActive;

      if (captured) break;
    }

    // Round events — smokescreen, rally cry, friendly fire, flag runner
    if (!captured) {
      for (const tribe of tribeMembers) {
        const myState = tribeState[tribe.name];
        const enemyTribe = tribeMembers.find(t => t.name !== tribe.name);
        if (!enemyTribe) continue;

        // Smokescreen
        if (Math.random() < 0.15) {
          const smokeCandidates = myState.activeAttackers.filter(n => pStats(n).temperament <= 4);
          if (smokeCandidates.length) {
            const smoker = pick(smokeCandidates);
            roundEvents.push({ type: 'smokescreen', player: smoker, text: pick(WAR_FLAG_EVENTS.smokescreen)(smoker, pronouns(smoker)) });
          }
        }

        // Rally cry
        if (Math.random() < 0.15) {
          const ralliers = myState.activeAttackers.filter(n => pStats(n).social >= 6);
          if (ralliers.length) {
            const rallier = pick(ralliers);
            roundEvents.push({ type: 'rallyCry', player: rallier, text: pick(WAR_FLAG_EVENTS.rallyCry)(rallier, pronouns(rallier)) });
            popDelta(rallier, 1);
          }
        }

        // Friendly fire
        if (Math.random() < 0.08 && myState.activeAttackers.length >= 2) {
          const [ff1, ff2] = [myState.activeAttackers[0], myState.activeAttackers[1]];
          roundEvents.push({ type: 'friendlyFire', players: [ff1, ff2], text: pick(WAR_FLAG_EVENTS.friendlyFire)(ff1, ff2, pronouns(ff1)) });
          ep.chalMemberScores[ff1] = (ep.chalMemberScores[ff1] || 0) - 3;
          popDelta(ff1, -1);
          addWarHeat(ff2, ff1, 1.5);
          addBond(ff1, ff2, -1.5);
          // Remove ff2 from active
          myState.activeAttackers = myState.activeAttackers.filter(n => n !== ff2);
        }

        // Flag runner
        if (Math.random() < 0.12) {
          const runners = myState.activeAttackers.filter(n => pStats(n).physical >= 7);
          if (runners.length) {
            const runner = pick(runners);
            const pr = pronouns(runner);
            roundEvents.push({ type: 'flagRunner', player: runner, text: pick(WAR_FLAG_EVENTS.flagRunner)(runner, pr) });
          }
        }
      }

      // Consume one trap per round (outermost used up)
      for (const tribe of tribeMembers) {
        const enemyState = tribeState[tribeMembers.find(t => t.name !== tribe.name).name];
        if (enemyState.traps.length > 0) enemyState.traps.shift();
      }
    }

    rounds.push({ num: round, attacks: roundAttacks, events: roundEvents });
    if (captured) break;
  }

  // Fallback: no capture after 5 rounds → most advances wins
  if (!winnerTribe) {
    const advances = {};
    tribeMembers.forEach(t => { advances[t.name] = 0; });
    for (const rd of rounds) {
      for (const atk of rd.attacks) {
        if (atk.advanced) advances[atk.tribe] = (advances[atk.tribe] || 0) + 1;
      }
    }
    const sorted = Object.entries(advances).sort((a, b) => b[1] - a[1]);
    winnerTribe = sorted[0][0];
  }

  result.captureFlag = {
    setup,
    rounds,
    winner: winnerTribe,
    capturedBy,
  };
  result.phases.push('captureFlag');
}

// ══════════════════════════════════════════════════════════════
// MAIN SIMULATE
// ══════════════════════════════════════════════════════════════
export function simulateFullMetalDrama(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    planeJump: null,
    paintBomb: null,
    captureFlag: null,
    breakEvents: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.fullMetalDrama = result;
  ep.challengeType = 'full-metal-drama';
  ep.challengeLabel = 'Full Metal Drama';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.mergeName || gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  // ── THREE PHASES ──
  _simulatePlaneJump(ep, tribeMembers, result);
  _simulatePaintBomb(ep, tribeMembers, result);
  _simulateWarDramaBreak(ep, tribeMembers, result);
  _simulateCaptureTheFlag(ep, tribeMembers, result);

  // ── FINAL SCORING ──
  // Paint bomb score (×20) + capture flag performance
  for (const tr of result.paintBomb.tribes) {
    result.tribeScores[tr.tribe] = (result.tribeScores[tr.tribe] || 0) + tr.score * 20;
  }
  // Phase 3 winner gets decisive bonus
  if (result.captureFlag.winner) {
    result.tribeScores[result.captureFlag.winner] = (result.tribeScores[result.captureFlag.winner] || 0) + 50;
  }

  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.tribalPlayers = [...ep.loser.members];
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);

  // ── SHOWMANCE MOMENT ──
  if (Math.random() < 0.4) {
    const showmances = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up');
    for (const sh of showmances) {
      const [a, b] = sh.players;
      const tribeA = tribeMembers.find(t => t.members.includes(a));
      const tribeB = tribeMembers.find(t => t.members.includes(b));
      if (tribeA && tribeB && tribeA.name !== tribeB.name && romanticCompat(a, b)) {
        const pr = pronouns(a);
        ep.campEvents[campKey].post.push({
          text: `In the chaos of war, ${a} locked eyes with ${b} across enemy lines. ${pr.Sub} hesitated — just for a second. That second cost ${pr.posAdj} tribe a trap.`,
          players: [a, b],
          badgeText: 'WAR ROMANCE', badgeClass: 'pink',
          tag: 'full-metal-drama-romance',
        });
        addBond(a, b, 1.0);
        break;
      }
    }
  }

  // ── COLD OPEN PRIORITY ──
  const coldOpen = [];
  if (result.captureFlag.capturedBy) {
    const cap = result.captureFlag.capturedBy;
    coldOpen.push({ priority: 4, text: `${cap} CAPTURED the enemy flag — ${winnerName} wins the war!`, player: cap });
  }
  const uncontrolled = result.paintBomb.tribes.find(t => !t.controlled);
  if (uncontrolled) {
    coldOpen.push({ priority: 3, text: `${uncontrolled.tribe}'s paint bomb went CATASTROPHICALLY uncontrolled!`, tribe: uncontrolled.tribe });
  }
  // Last stand
  const lastStandEvt = result.captureFlag.rounds.flatMap(r => r.events).find(e => e.type === 'lastStand');
  if (lastStandEvt) {
    coldOpen.push({ priority: 2, text: `${lastStandEvt.player} made an incredible last stand defending the flag!`, player: lastStandEvt.player });
  }
  // Friendly fire
  const ffEvt = result.captureFlag.rounds.flatMap(r => r.events).find(e => e.type === 'friendlyFire');
  if (ffEvt) {
    coldOpen.push({ priority: 1.5, text: `Friendly fire! ${ffEvt.players[0]} paint-bombed their OWN teammate!`, player: ffEvt.players[0] });
  }
  // Flanking hero
  const flankEvt = result.captureFlag.rounds.flatMap(r => r.events).find(e => e.type === 'flankingManeuver');
  if (flankEvt) {
    coldOpen.push({ priority: 1, text: `${flankEvt.player} flanked the ENTIRE defense — tactical genius!`, player: flankEvt.player });
  }
  result.coldOpen = coldOpen.sort((a, b) => b.priority - a.priority)[0] || null;

  updateChalRecord(ep);

  // ── POST-CHALLENGE CAMP EVENT ──
  ep.campEvents[campKey].post.push({
    text: `Full Metal Drama: ${winnerName} wins the war. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'FULL METAL DRAMA', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugFullMetalDrama = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
    planeJump: result.planeJump,
    paintBomb: { tribes: result.paintBomb.tribes.map(t => ({ tribe: t.tribe, quality: t.quality, spectacle: t.spectacle, controlled: t.controlled, score: t.score })), winner: result.paintBomb.winner },
    captureFlag: { setup: result.captureFlag.setup, roundCount: result.captureFlag.rounds.length, winner: result.captureFlag.winner, capturedBy: result.captureFlag.capturedBy },
    breakEventCount: result.breakEvents?.length || 0,
    coldOpen: result.coldOpen,
  };
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textFullMetalDrama(ep, ln, sec) {
  const fm = ep.fullMetalDrama;
  if (!fm) return;
  const h = host();

  sec('Full Metal Drama');
  ln(pick(WAR_HOST.planeIntro)(h));
  ln('');

  // Phase 1
  if (fm.planeJump) {
    ln('**PHASE 1: PLANE JUMP**');
    for (const evt of fm.planeJump.events) {
      ln(evt.text);
    }
    for (const [tribe, order] of Object.entries(fm.planeJump.jumpOrder)) {
      ln(`${tribe} jump order: ${order.join(', ')}`);
    }
    ln('');
  }

  // Phase 2
  if (fm.paintBomb) {
    ln('**PHASE 2: PAINT BOMB**');
    ln(pick(WAR_HOST.paintBombIntro)(h));
    for (const tr of fm.paintBomb.tribes) {
      for (const evt of tr.events) ln(evt.text);
      ln(tr.hostJudge);
      ln(`${tr.tribe}: Quality ${tr.quality.toFixed(2)} | ${tr.controlled ? 'CONTROLLED' : 'UNCONTROLLED'} | Score ${tr.score.toFixed(2)}`);
    }
    ln(`Phase 2 Winner: ${fm.paintBomb.winner}`);
    ln('');
  }

  // Drama break
  if (fm.breakEvents?.length) {
    ln('**BETWEEN PHASES — WAR DRAMA**');
    for (const evt of fm.breakEvents) ln(evt.text);
    ln('');
  }

  // Phase 3
  if (fm.captureFlag) {
    ln('**PHASE 3: CAPTURE THE FLAG**');
    ln(pick(WAR_HOST.flagIntro)(h));
    for (const s of fm.captureFlag.setup) {
      ln(`${s.tribe}: ${s.attackers} attackers, ${s.defenders} defenders, ${s.traps} traps, ${s.foxholes} foxholes, ${s.sentries} sentries`);
    }
    for (const rd of fm.captureFlag.rounds) {
      ln(`— Round ${rd.num} —`);
      for (const evt of rd.events) ln(evt.text);
      for (const atk of rd.attacks) {
        ln(`  ${atk.attacker} (${atk.tribe}): trap=${atk.trapResult} def=${atk.defenderResult} ${atk.advanced ? '→ ADVANCED' : '→ stopped'}`);
      }
    }
    if (fm.captureFlag.capturedBy) {
      ln(`FLAG CAPTURED by ${fm.captureFlag.capturedBy}! ${fm.captureFlag.winner} wins!`);
    } else {
      ln(`No capture — ${fm.captureFlag.winner} wins on advances.`);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// VP SCREENS
// ══════════════════════════════════════════════════════════════
export function rpBuildFullMetalDramaTitleCard(ep) {
  if (!ep.fullMetalDrama) return '';
  const fm = ep.fullMetalDrama;
  const h = host();

  let html = `<div style="background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);padding:30px;color:#e0e0e0;font-family:'Courier New',monospace;min-height:100vh;">`;
  html += `<div style="text-align:center;margin-bottom:30px;">`;
  html += `<h1 style="color:#ff6b35;font-size:2.5em;text-shadow:2px 2px 0 #000;letter-spacing:3px;">⚔️ FULL METAL DRAMA ⚔️</h1>`;
  html += `<p style="color:#84cc16;font-size:1.1em;">"Three phases. One winner. Maximum carnage."</p>`;
  html += `</div>`;

  // Phase 1: Jump
  if (fm.planeJump) {
    html += `<div style="background:rgba(255,107,53,0.1);border:1px solid #ff6b35;border-radius:8px;padding:20px;margin-bottom:20px;">`;
    html += `<h2 style="color:#ff6b35;margin:0 0 15px;">🪂 PHASE 1: PLANE JUMP</h2>`;
    for (const evt of fm.planeJump.events) {
      const color = evt.type === 'heroicDive' ? '#84cc16' : evt.type === 'panicRefusal' ? '#ef4444' : '#e0e0e0';
      html += `<p style="color:${color};margin:5px 0;padding:4px 8px;${evt.type === 'heroicDive' ? 'background:rgba(132,204,22,0.1);border-left:3px solid #84cc16;' : ''}">${evt.text}</p>`;
    }
    for (const [tribe, order] of Object.entries(fm.planeJump.jumpOrder)) {
      html += `<p style="color:#94a3b8;margin-top:10px;"><strong>${tribe}:</strong> ${order.join(' → ')}</p>`;
    }
    html += `</div>`;
  }

  // Phase 2: Paint Bomb
  if (fm.paintBomb) {
    html += `<div style="background:rgba(168,85,247,0.1);border:1px solid #a855f7;border-radius:8px;padding:20px;margin-bottom:20px;">`;
    html += `<h2 style="color:#a855f7;margin:0 0 15px;">💣 PHASE 2: PAINT BOMB</h2>`;
    for (const tr of fm.paintBomb.tribes) {
      const statusColor = tr.controlled ? '#84cc16' : '#ef4444';
      html += `<div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:6px;margin-bottom:10px;">`;
      html += `<h3 style="color:#e0e0e0;margin:0 0 8px;">${tr.tribe} <span style="color:${statusColor};font-size:0.8em;">[${tr.controlled ? 'CONTROLLED' : 'UNCONTROLLED'}]</span></h3>`;
      for (const evt of tr.events) {
        html += `<p style="color:#cbd5e1;margin:4px 0;">${evt.text}</p>`;
      }
      html += `<p style="color:${statusColor};margin-top:8px;font-weight:bold;">Score: ${tr.score.toFixed(2)}</p>`;
      if (tr.hostJudge) html += `<p style="color:#fbbf24;font-style:italic;margin-top:6px;">${tr.hostJudge}</p>`;
      html += `</div>`;
    }
    html += `<p style="color:#84cc16;text-align:center;font-size:1.1em;margin-top:10px;">Phase 2 Winner: <strong>${fm.paintBomb.winner}</strong></p>`;
    html += `</div>`;
  }

  // Drama Break
  if (fm.breakEvents?.length) {
    html += `<div style="background:rgba(239,68,68,0.1);border:1px solid #ef4444;border-radius:8px;padding:20px;margin-bottom:20px;">`;
    html += `<h2 style="color:#ef4444;margin:0 0 15px;">🎭 WAR DRAMA</h2>`;
    for (const evt of fm.breakEvents) {
      html += `<div style="margin:8px 0;padding:8px;border-left:3px solid ${evt.badgeClass === 'red' ? '#ef4444' : evt.badgeClass === 'green' ? '#22c55e' : evt.badgeClass === 'blue' ? '#3b82f6' : '#f59e0b'};background:rgba(0,0,0,0.2);border-radius:0 6px 6px 0;">`;
      html += `<span style="background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:4px;font-size:0.75em;color:#94a3b8;">${evt.badgeText}</span>`;
      html += `<p style="color:#e0e0e0;margin:6px 0 0;">${evt.text}</p>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  // Phase 3: Capture the Flag
  if (fm.captureFlag) {
    html += `<div style="background:rgba(132,204,22,0.1);border:1px solid #84cc16;border-radius:8px;padding:20px;margin-bottom:20px;">`;
    html += `<h2 style="color:#84cc16;margin:0 0 15px;">🚩 PHASE 3: CAPTURE THE FLAG</h2>`;

    // Setup
    html += `<div style="display:flex;gap:15px;flex-wrap:wrap;margin-bottom:15px;">`;
    for (const s of fm.captureFlag.setup) {
      html += `<div style="flex:1;min-width:200px;background:rgba(0,0,0,0.3);padding:12px;border-radius:6px;">`;
      html += `<h4 style="color:#84cc16;margin:0 0 8px;">${s.tribe}</h4>`;
      html += `<p style="color:#94a3b8;margin:2px 0;">⚔️ ${s.attackers} attackers | 🛡️ ${s.defenders} defenders</p>`;
      html += `<p style="color:#94a3b8;margin:2px 0;">💣 ${s.traps} traps | 🕳️ ${s.foxholes} foxholes | 👁️ ${s.sentries} sentries</p>`;
      html += `</div>`;
    }
    html += `</div>`;

    // Rounds
    for (const rd of fm.captureFlag.rounds) {
      html += `<div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:6px;margin-bottom:10px;">`;
      html += `<h4 style="color:#fbbf24;margin:0 0 8px;">⚔️ ROUND ${rd.num}</h4>`;
      for (const evt of rd.events) {
        const evtColor = evt.type === 'flagCapture' ? '#84cc16' : evt.type === 'boobyTrapTrigger' ? '#ef4444' : evt.type === 'lastStand' ? '#fbbf24' : '#e0e0e0';
        html += `<p style="color:${evtColor};margin:4px 0;${evt.type === 'flagCapture' ? 'font-size:1.2em;font-weight:bold;' : ''}">${evt.text}</p>`;
      }
      html += `</div>`;
    }

    // Result
    if (fm.captureFlag.capturedBy) {
      html += `<div style="text-align:center;padding:20px;background:rgba(132,204,22,0.2);border-radius:8px;margin-top:15px;">`;
      html += `<p style="color:#84cc16;font-size:1.5em;font-weight:bold;">🏆 FLAG CAPTURED by ${fm.captureFlag.capturedBy}!</p>`;
      html += `<p style="color:#e0e0e0;">${fm.captureFlag.winner} wins the war!</p>`;
      html += `</div>`;
    } else {
      html += `<p style="color:#fbbf24;text-align:center;font-size:1.1em;">No capture — ${fm.captureFlag.winner} wins on advances.</p>`;
    }
    html += `</div>`;
  }

  // Final result
  html += `<div style="text-align:center;padding:20px;border-top:2px solid #ff6b35;margin-top:20px;">`;
  const sorted = Object.entries(fm.tribeScores).sort((a, b) => b[1] - a[1]);
  for (const [tribe, score] of sorted) {
    html += `<p style="color:#e0e0e0;font-size:1.1em;">${tribe}: <strong style="color:#ff6b35;">${score.toFixed(1)}</strong> pts</p>`;
  }
  html += `</div>`;

  html += `</div>`;
  return html;
}

export function fullMetalDramaRevealNext() {}
export function fullMetalDramaRevealAll() {}

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
      const jumpCheck = s.boldness * 0.06 + s.endurance * 0.03 + noise(0.2);

      if (jumpCheck > 0.45) {
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

  // Collect all refusers across tribes — they sit out Phase 2
  const allRefusers = new Set();
  for (const tribe of tribeMembers) {
    const jumpers = jumpOrder[tribe.name] || [];
    for (const name of tribe.members) {
      if (!jumpers.includes(name) || events.some(e => e.type === 'panicRefusal' && e.player === name)) {
        allRefusers.add(name);
      }
    }
  }

  result.planeJump = { jumpOrder, events, jumpers: allPlayers.filter(n => !allRefusers.has(n)), refusers: [...allRefusers] };
  result.phases.push('planeJump');
}

// ══════════════════════════════════════════════════════════════
// PHASE 2: PAINT BOMB
// ══════════════════════════════════════════════════════════════
function _simulatePaintBomb(ep, tribeMembers, result) {
  const jumpOrder = result.planeJump?.jumpOrder || {};
  const tribeResults = [];
  let bestScore = -Infinity, winnerTribe = null;

  const refuserSet = new Set(result.planeJump?.refusers || []);

  for (const tribe of tribeMembers) {
    const members = tribe.members;
    const activeMembers = members.filter(m => !refuserSet.has(m));
    const jumperSet = new Set(jumpOrder[tribe.name] || []);
    let quality = 0, spectacle = 0;
    const contributions = {};
    const events = [];

    // Only jumpers contribute — refusers sit out
    for (const name of activeMembers) {
      const s = pStats(name);
      let q = s.mental * 0.04 + s.strategic * 0.03 + noise(0.2);
      let sp = s.boldness * 0.03;
      if (jumperSet.has(name)) q += 0.05;
      contributions[name] = { quality: q, spectacle: sp };
      quality += q;
      spectacle += sp;
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.round(q * 3);
    }

    // Control threshold
    const avgControl = activeMembers.length > 0 ? activeMembers.reduce((s, n) => s + (pStats(n).mental + pStats(n).temperament), 0) / activeMembers.length : 5;
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
// VP SCREENS — WAR ROOM
// ══════════════════════════════════════════════════════════════

/* ── portrait helper ── */
function _fmdPortrait(name, size = 44) {
  const p = players.find(x => x.name === name);
  const slug = p?.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const init = (name || '?')[0].toUpperCase();
  return `<img src="assets/avatars/${slug}.png" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;filter:contrast(1.15) saturate(0.85)" /><span style="display:none;width:${size}px;height:${size}px;border-radius:50%;background:var(--wd-steel);color:#fff;font-size:${Math.round(size*0.45)}px;line-height:${size}px;text-align:center;display:none">${init}</span>`;
}

/* ── military ID card ── */
function _fmdIdCard(name, role, statusText, statusColor) {
  const p = players.find(x => x.name === name);
  const slug = p?.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const init = (name || '?')[0].toUpperCase();
  const serial = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0).toString(16).toUpperCase().padStart(4, '0');
  return `<div class="fmd-id-card">
    <div class="fmd-id-stripe" style="background:${statusColor || 'var(--wd-olive)'}"></div>
    <div class="fmd-id-photo">
      <img src="assets/avatars/${slug}.png" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
      <span style="display:none">${init}</span>
    </div>
    <div class="fmd-id-info">
      <div class="fmd-id-name">${name}</div>
      <div class="fmd-id-rank">PVT &middot; #${serial}</div>
      ${role ? `<div class="fmd-id-role">${role}</div>` : ''}
      ${statusText ? `<div class="fmd-id-status" style="color:${statusColor || 'var(--wd-khaki)'}">${statusText}</div>` : ''}
    </div>
  </div>`;
}

/* ── small side portrait ── */
function _fmdSidePortrait(name, size = 28) {
  const p = players.find(x => x.name === name);
  const slug = p?.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const init = (name || '?')[0].toUpperCase();
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0;border:1px solid rgba(196,167,119,0.3);display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3)">
    <img src="assets/avatars/${slug}.png" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" style="width:${size}px;height:${size}px;object-fit:cover;filter:contrast(1.1) saturate(0.85)" />
    <span style="display:none;font-size:${Math.round(size*0.45)}px;color:var(--wd-khaki)">${init}</span>
  </div>`;
}

/* ── barbed wire divider ── */
const _fmdBarbed = `<div class="fmd-barbed"></div>`;

/* ── badge helper ── */
function _fmdBadge(text, cls) {
  return `<span class="fmd-ev-badge ${cls || ''}">${text}</span>`;
}

/* ── CSS Shell ── */
function _fmdShell(content, ep) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Inter:wght@400;600;700;900&display=swap');

.fmd-shell{
  --wd-olive:#4d5c2e;--wd-khaki:#c4a777;--wd-mud:#5c4033;
  --wd-steel:#64748b;--wd-camo:#3d4f2f;--wd-blood:#991b1b;
  --wd-dog-tag:#a8a29e;--wd-barbed:#78716c;
  --wd-paint-red:#ef4444;--wd-paint-blue:#3b82f6;--wd-paint-yellow:#eab308;
  --wd-explosion:#f97316;
  font-family:'Inter',sans-serif;color:#e2e0db;
  background:linear-gradient(180deg,#2d3318 0%,#3d4f2f 15%,#4d5c2e 35%,#5c4033 60%,#3a2a1e 85%,#1a1208 100%);
  padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
  overflow:clip;border:3px solid #3a2a1e;box-shadow:inset 0 0 60px rgba(0,0,0,0.5),0 0 30px rgba(0,0,0,0.5);
}

/* ── tactical map texture ── */
.fmd-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;clip-path:inset(0);
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.45' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
  opacity:.06;pointer-events:none;z-index:5;mix-blend-mode:overlay}

/* ── radio static overlay ── */
.fmd-shell::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;clip-path:inset(0);
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.015) 2px,rgba(255,255,255,0.015) 4px);
  pointer-events:none;z-index:4;animation:fmd-scanline 8s linear infinite}

/* ── Header — command bar ── */
.fmd-header{background:linear-gradient(180deg,#1a1208 0%,#2a1f10 50%,#1a1208 100%);
  padding:16px 20px;display:flex;align-items:center;justify-content:space-between;
  border-bottom:3px solid var(--wd-khaki);position:relative;z-index:6;
  box-shadow:inset 0 -2px 8px rgba(0,0,0,0.5),0 2px 10px rgba(0,0,0,0.4)}
.fmd-title{font-family:'Black Ops One',sans-serif;font-size:18px;color:var(--wd-khaki);
  text-shadow:2px 2px 0 rgba(0,0,0,0.6);letter-spacing:3px}
.fmd-subtitle{font-size:10px;color:rgba(196,167,119,0.5);letter-spacing:4px;text-transform:uppercase;margin-top:2px}

/* ── Layout ── */
.fmd-layout{display:flex;gap:14px;align-items:flex-start;padding:14px;position:relative;z-index:6}
.fmd-feed{flex:1;min-width:0}
.fmd-sidebar{width:260px;flex-shrink:0;position:sticky;top:0;max-height:100vh;overflow-y:auto;align-self:flex-start;
  scrollbar-width:thin;scrollbar-color:rgba(196,167,119,0.2) transparent;
  background:linear-gradient(180deg,rgba(26,18,8,0.9),rgba(58,42,30,0.85));
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  border:1px solid rgba(196,167,119,0.15);border-radius:4px;padding:12px;
  box-shadow:inset 0 0 20px rgba(0,0,0,0.3)}

/* ── HUD — stencil scoreboard ── */
.fmd-hud{display:flex;gap:2px;margin:0 14px 2px;position:relative;z-index:6}
.fmd-hud-cell{flex:1;background:rgba(0,0,0,0.45);border:1px solid rgba(196,167,119,0.12);
  padding:8px 4px;text-align:center}
.fmd-hud-cell:first-child{border-radius:4px 0 0 4px}.fmd-hud-cell:last-child{border-radius:0 4px 4px 0}
.fmd-hud-val{font-family:'Black Ops One',sans-serif;font-size:18px;font-weight:700;color:var(--wd-khaki);
  text-shadow:0 0 8px rgba(196,167,119,0.3)}
.fmd-hud-lbl{font-size:7px;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-top:2px;text-transform:uppercase}

/* ── Event cards ── */
.fmd-ev{background:linear-gradient(135deg,rgba(77,92,46,0.12),rgba(92,64,51,0.08));
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  border:1px solid rgba(196,167,119,0.1);border-left:3px solid var(--wd-olive);
  padding:12px 14px;margin-bottom:5px;display:flex;align-items:flex-start;gap:12px;
  border-radius:3px;animation:fmd-fade-up 0.4s ease-out;position:relative}
.fmd-ev.negative{border-left-color:var(--wd-blood)}
.fmd-ev.positive{border-left-color:var(--wd-khaki)}
.fmd-ev.heroic{border-left-color:#84cc16}
.fmd-ev.explosive{border-left-color:var(--wd-explosion);position:relative;overflow:hidden}
.fmd-ev.explosive::before{content:'';position:absolute;top:50%;left:30%;width:0;height:0;
  border-radius:50%;background:radial-gradient(circle,var(--wd-explosion) 0%,rgba(249,115,22,0.3) 40%,transparent 70%);
  animation:fmd-paint-burst 0.8s ease-out forwards;pointer-events:none;z-index:0}
.fmd-ev.explosive.score-high::before{width:200%;height:200%;top:-50%;left:-50%;
  background:radial-gradient(circle,var(--wd-paint-red) 0%,var(--wd-explosion) 20%,rgba(234,179,8,0.3) 45%,transparent 70%)}
.fmd-ev.explosive.score-mid::before{width:150%;height:150%;top:-25%;left:-10%;
  background:radial-gradient(circle,var(--wd-explosion) 0%,rgba(234,179,8,0.3) 40%,transparent 65%)}
.fmd-ev.explosive.score-low::before{width:80%;height:80%;top:10%;left:20%;
  background:radial-gradient(circle,rgba(249,115,22,0.4) 0%,transparent 60%)}
.fmd-ev.explosive.uncontrolled::before{width:300%;height:300%;top:-100%;left:-100%;
  background:radial-gradient(circle,#ef4444 0%,var(--wd-explosion) 15%,#eab308 30%,rgba(239,68,68,0.2) 50%,transparent 70%);
  animation:fmd-paint-burst 1.2s ease-out forwards}
.fmd-ev.explosive .fmd-ev-content{position:relative;z-index:1}

/* Paint splatter spots */
.fmd-splat{position:absolute;border-radius:50%;pointer-events:none;z-index:0;animation:fmd-splat-in 0.5s ease-out both}
@keyframes fmd-paint-burst{0%{transform:scale(0);opacity:0.9}60%{opacity:0.5}100%{transform:scale(1);opacity:0.15}}
@keyframes fmd-splat-in{0%{transform:scale(0) rotate(0deg);opacity:0}50%{opacity:0.6}100%{transform:scale(1) rotate(var(--rot,15deg));opacity:0.3}}
.fmd-ev.round-header{border-left-color:var(--wd-mud);
  background:linear-gradient(135deg,rgba(92,64,51,0.2),rgba(61,79,47,0.15));
  font-family:'Black Ops One',sans-serif}
.fmd-ev.capture{border-left-color:#22c55e;background:rgba(34,197,94,0.1);border-width:4px}
.fmd-ev-badge{display:inline-block;font-family:'Black Ops One',sans-serif;font-size:7px;letter-spacing:2px;
  padding:2px 8px;border-radius:2px;margin-bottom:4px;text-transform:uppercase;
  background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7)}
.fmd-ev-badge.gold{background:rgba(196,167,119,0.2);color:var(--wd-khaki)}
.fmd-ev-badge.red{background:rgba(153,27,27,0.25);color:#ef4444}
.fmd-ev-badge.green{background:rgba(34,197,94,0.15);color:#84cc16}
.fmd-ev-badge.blue{background:rgba(59,130,246,0.15);color:var(--wd-paint-blue)}
.fmd-ev-badge.orange{background:rgba(249,115,22,0.15);color:var(--wd-explosion)}
.fmd-ev-badge.purple{background:rgba(168,85,247,0.15);color:#c084fc}
.fmd-ev-badge.pink{background:rgba(219,39,119,0.15);color:#f472b6}
.fmd-ev-badge.gray{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.4)}
.fmd-ev-badge.sky{background:rgba(56,189,248,0.15);color:#38bdf8}
.fmd-ev-text{font-size:13px;line-height:1.7;color:rgba(255,255,255,0.85)}
.fmd-ev-port{width:44px;height:44px;border-radius:50%;overflow:hidden;flex-shrink:0;display:flex;
  align-items:center;justify-content:center;border:2px solid rgba(196,167,119,0.3)}
.fmd-ev-port img{width:44px;height:44px;border-radius:50%;object-fit:cover;filter:contrast(1.1) saturate(0.85)}

/* ── Military ID Card ── */
.fmd-id-card{display:inline-flex;align-items:stretch;gap:0;
  background:linear-gradient(135deg,#2a2520,#3a3025);
  border:2px solid rgba(196,167,119,0.25);border-radius:4px;overflow:hidden;
  box-shadow:2px 2px 8px rgba(0,0,0,0.4);min-width:160px;max-width:220px}
.fmd-id-stripe{width:6px;flex-shrink:0}
.fmd-id-photo{width:48px;height:48px;flex-shrink:0;overflow:hidden;margin:6px;border-radius:2px;
  border:1px solid rgba(196,167,119,0.2);display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3)}
.fmd-id-photo img{width:48px;height:48px;object-fit:cover;filter:contrast(1.15) saturate(0.8)}
.fmd-id-photo span{font-size:18px;color:var(--wd-khaki)}
.fmd-id-info{padding:6px 8px 6px 0;flex:1;min-width:0}
.fmd-id-name{font-family:'Black Ops One',sans-serif;font-size:11px;color:var(--wd-khaki);letter-spacing:1px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fmd-id-rank{font-size:8px;color:rgba(168,162,158,0.7);letter-spacing:2px;margin-top:1px}
.fmd-id-role{font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:1px;margin-top:2px;text-transform:uppercase}
.fmd-id-status{font-size:8px;font-weight:700;letter-spacing:1px;margin-top:2px;text-transform:uppercase}

/* ── Barbed wire divider ── */
.fmd-barbed{height:12px;margin:14px 0;position:relative;
  background:repeating-linear-gradient(90deg,transparent 0px,transparent 8px,rgba(120,113,108,0.3) 8px,rgba(120,113,108,0.3) 9px,transparent 9px,transparent 14px);
  border-top:1px solid rgba(120,113,108,0.2);border-bottom:1px solid rgba(120,113,108,0.2)}
.fmd-barbed::before,.fmd-barbed::after{content:'';position:absolute;top:3px;width:8px;height:8px;
  border:1px solid rgba(120,113,108,0.4);border-radius:1px;transform:rotate(45deg)}
.fmd-barbed::before{left:20%}.fmd-barbed::after{right:20%}

/* ── Controls ── */
.fmd-controls{display:flex;gap:8px;justify-content:center;padding:14px 0;position:relative;z-index:6}
.fmd-btn-next{padding:8px 20px;font-family:'Black Ops One',sans-serif;font-size:12px;letter-spacing:2px;
  color:var(--wd-khaki);background:rgba(77,92,46,0.3);border:2px solid var(--wd-khaki);border-radius:4px;
  cursor:pointer;text-transform:uppercase;transition:all 0.2s}
.fmd-btn-next:hover{background:rgba(77,92,46,0.5);box-shadow:0 0 12px rgba(196,167,119,0.2)}
.fmd-btn-all{padding:8px 16px;font-size:11px;color:rgba(255,255,255,0.5);background:transparent;
  border:1px solid rgba(255,255,255,0.15);border-radius:4px;cursor:pointer}
.fmd-btn-all:hover{color:rgba(255,255,255,0.7);border-color:rgba(255,255,255,0.3)}

/* ── Side section ── */
.fmd-side-sec{font-family:'Black Ops One',sans-serif;font-size:9px;letter-spacing:3px;
  color:var(--wd-khaki);text-transform:uppercase;padding:6px 0 4px;
  border-bottom:1px solid rgba(196,167,119,0.15);margin-top:8px}
.fmd-side-sec:first-child{margin-top:0}

/* ── Animations ── */
@keyframes fmd-fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fmd-scanline{0%{background-position:0 0}100%{background-position:0 200px}}
@keyframes fmd-pulse{0%,100%{opacity:1}50%{opacity:0.6}}
@keyframes fmd-incoming{0%{transform:scale(0.8);opacity:0}50%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes fmd-explode{0%{transform:scale(0);opacity:1}100%{transform:scale(3);opacity:0}}
@keyframes fmd-static{0%{opacity:0.03}25%{opacity:0.06}50%{opacity:0.02}75%{opacity:0.05}100%{opacity:0.03}}

/* ── Paint splatter ── */
.fmd-splatter{position:absolute;border-radius:50%;pointer-events:none;animation:fmd-explode 0.6s ease-out forwards;z-index:3}

/* ── Reduced motion ── */
@media(prefers-reduced-motion:reduce){
  .fmd-ev{animation:none}
  .fmd-shell::after{animation:none}
  .fmd-splatter{animation:none}
}
</style>
<div class="fmd-shell">
  <div class="fmd-header">
    <div>
      <div class="fmd-title">FULL METAL DRAMA</div>
      <div class="fmd-subtitle">Episode ${ep.num || '?'} &middot; War Challenge</div>
    </div>
    <div style="font-size:10px;color:rgba(196,167,119,0.4);letter-spacing:2px;text-transform:uppercase">CLASSIFIED</div>
  </div>
  ${content}
</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   1. TITLE CARD
   ═══════════════════════════════════════════════════════════════ */
export function rpBuildFullMetalDramaTitleCard(ep) {
  const fm = ep.fullMetalDrama;
  if (!fm) return '';

  const tribeNames = Object.keys(fm.tribeScores || {});
  const allPlayers = gs.tribes ? gs.tribes.flatMap(t => t.members) : [];

  const taglines = [
    '"Three phases. One winner. Maximum carnage."',
    '"War is hell. Reality TV is worse."',
    '"You don\'t volunteer for this. You survive it."',
  ];
  const tagline = taglines[Math.floor((ep.num || 0) % taglines.length)];

  return _fmdShell(`
    <div style="text-align:center;padding:60px 20px 80px;position:relative;z-index:6;">
      <!-- Stencil line -->
      <div style="font-family:'Inter',sans-serif;font-size:11px;letter-spacing:5px;color:rgba(196,167,119,0.4);text-transform:uppercase;margin-bottom:14px;">OPERATION BRIEFING &middot; ${host().toUpperCase()} COMMANDING</div>

      <!-- Main title -->
      <div style="font-family:'Black Ops One',sans-serif;font-size:44px;color:var(--wd-khaki);text-shadow:3px 3px 0 rgba(0,0,0,0.6),6px 6px 0 rgba(0,0,0,0.2);letter-spacing:6px;line-height:1.1;margin-bottom:8px;">FULL METAL<br>DRAMA</div>

      <!-- Tagline -->
      <div style="font-family:'Inter',sans-serif;font-size:13px;font-style:italic;color:rgba(255,255,255,0.6);margin-bottom:24px;letter-spacing:1px;">${tagline}</div>

      <!-- Phase breakdown -->
      <div style="display:inline-block;background:rgba(0,0,0,0.35);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(196,167,119,0.15);border-radius:4px;padding:16px 28px;margin-bottom:24px;">
        <div style="font-size:9px;letter-spacing:4px;color:rgba(196,167,119,0.4);text-transform:uppercase;margin-bottom:10px;">MISSION PHASES</div>
        <div style="display:flex;gap:24px;justify-content:center;font-size:13px;color:rgba(255,255,255,0.8);">
          <div style="text-align:center"><div style="font-family:'Black Ops One',sans-serif;font-size:18px;color:var(--wd-paint-blue);margin-bottom:2px;">I</div><div style="font-size:10px;letter-spacing:1px">PLANE JUMP</div></div>
          <div style="color:rgba(196,167,119,0.3)">&middot;</div>
          <div style="text-align:center"><div style="font-family:'Black Ops One',sans-serif;font-size:18px;color:var(--wd-explosion);margin-bottom:2px;">II</div><div style="font-size:10px;letter-spacing:1px">PAINT BOMB</div></div>
          <div style="color:rgba(196,167,119,0.3)">&middot;</div>
          <div style="text-align:center"><div style="font-family:'Black Ops One',sans-serif;font-size:18px;color:#84cc16;margin-bottom:2px;">III</div><div style="font-size:10px;letter-spacing:1px">CAPTURE FLAG</div></div>
        </div>
      </div>

      <!-- Tribes -->
      <div style="display:flex;gap:24px;justify-content:center;margin-bottom:20px;flex-wrap:wrap;">
        ${tribeNames.map(t => `<div style="text-align:center;padding:10px 16px;background:rgba(0,0,0,0.25);border:1px solid rgba(196,167,119,0.1);border-radius:4px;min-width:120px;">
          <div style="font-family:'Black Ops One',sans-serif;font-size:14px;color:var(--wd-khaki);letter-spacing:2px;">${t}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px;">${(gs.tribes.find(tr => tr.name === t)?.members || []).length} soldiers</div>
        </div>`).join('')}
      </div>

      <!-- Footer stats -->
      <div style="display:flex;gap:20px;justify-content:center;font-size:11px;color:rgba(196,167,119,0.4);flex-wrap:wrap;">
        <span>${allPlayers.length} Combatants</span>
        <span>&middot;</span>
        <span>3 Phases</span>
        <span>&middot;</span>
        <span>1 Survivor</span>
      </div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════════════
   2. PLANE JUMP (click-to-reveal per player)
   ═══════════════════════════════════════════════════════════════ */
export function rpBuildFullMetalDramaJump(ep) {
  const fm = ep.fullMetalDrama;
  if (!fm || !fm.planeJump) return '';
  const pj = fm.planeJump;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'fmd-jump';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  // Build steps array from events
  const steps = pj.events || [];
  const totalSteps = steps.length;

  // Sidebar — altitude meter + jump status per tribe
  function buildJumpSidebar(revealCount) {
    const revealed = steps.slice(0, revealCount);
    const jumpedSet = new Set(revealed.filter(e => e.type === 'heroicDive' || e.type === 'jump' || e.type === 'tandemJump' || e.type === 'cornedBeefLure').map(e => e.player).filter(Boolean));
    const refusedSet = new Set(revealed.filter(e => e.type === 'panicRefusal').map(e => e.player).filter(Boolean));
    const mentionedSet = new Set([...jumpedSet, ...refusedSet]);

    let sb = '';
    sb += `<div class="fmd-side-sec">ALTITUDE: 10,000 FT</div>`;
    sb += `<div style="height:8px;background:rgba(0,0,0,0.3);border-radius:4px;overflow:hidden;margin:6px 0 10px">
      <div style="height:100%;width:${Math.min(100, (revealCount / Math.max(1, totalSteps)) * 100)}%;background:linear-gradient(90deg,var(--wd-paint-blue),#38bdf8);border-radius:4px;transition:width 0.3s"></div>
    </div>`;

    for (const [tribe, order] of Object.entries(pj.jumpOrder || {})) {
      sb += `<div class="fmd-side-sec">${tribe}</div>`;
      for (const name of order) {
        const jumped = jumpedSet.has(name);
        const refused = refusedSet.has(name);
        const known = mentionedSet.has(name);
        const icon = !known ? '&#10067;' : jumped ? '&#9989;' : refused ? '&#128020;' : '&#10067;';
        sb += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;color:rgba(255,255,255,${known ? 0.8 : 0.3});opacity:${known ? 1 : 0.4}">
          ${_fmdSidePortrait(name, 24)}
          <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</span>
          <span>${icon}</span>
        </div>`;
      }
    }
    return sb;
  }

  // Feed
  let feed = '';
  // Opening step
  feed += `<div class="fmd-ev round-header" style="${0 <= revIdx ? '' : 'display:none'}" id="fmd-step-jump-0">
    <div class="fmd-ev-port" style="font-size:22px;border-color:rgba(59,130,246,0.3);">&#9992;</div>
    <div style="flex:1"><div class="fmd-ev-badge sky">PHASE I &mdash; PLANE JUMP</div>
    <div class="fmd-ev-text">${pick(WAR_HOST.planeIntro)(host())}</div></div>
  </div>`;

  // Event steps (offset by 1 for the opening step)
  for (let i = 0; i < steps.length; i++) {
    const evt = steps[i];
    const visible = (i + 1) <= revIdx;
    const evtClass = evt.type === 'heroicDive' ? 'heroic' : evt.type === 'panicRefusal' ? 'negative' : evt.type === 'midAirConflict' ? 'negative' : 'positive';
    const badgeText = evt.type === 'heroicDive' ? 'HEROIC DIVE' : evt.type === 'panicRefusal' ? 'REFUSED' : evt.type === 'tandemJump' ? 'TANDEM JUMP' : evt.type === 'cornedBeefLure' ? 'CORNED BEEF LURE' : evt.type === 'midAirConflict' ? 'MID-AIR CONFLICT' : 'JUMP';
    const badgeColor = evt.type === 'heroicDive' ? 'green' : evt.type === 'panicRefusal' ? 'red' : evt.type === 'midAirConflict' ? 'red' : evt.type === 'tandemJump' ? 'blue' : 'sky';
    const playerName = evt.player || (evt.players ? evt.players[0] : '');

    feed += `<div id="fmd-step-jump-${i + 1}" class="fmd-ev ${evtClass}" style="${visible ? '' : 'display:none'}">
      ${playerName ? `<div class="fmd-ev-port">${_fmdPortrait(playerName, 44)}</div>` : ''}
      <div style="flex:1;min-width:0">
        <div class="fmd-ev-badge ${badgeColor}">${badgeText}</div>
        <div class="fmd-ev-text">${evt.text || ''}</div>
      </div>
    </div>`;
  }

  const totalWithOpening = steps.length + 1;
  const pending = revIdx < totalWithOpening - 1;
  const controls = `<div id="fmd-controls-jump" class="fmd-controls" ${!pending && totalWithOpening ? 'style="display:none"' : ''}>
    <button class="fmd-btn-next" onclick="fullMetalDramaRevealNext('fmd-jump',${totalWithOpening})">NEXT DROP</button>
    <button class="fmd-btn-all" onclick="fullMetalDramaRevealAll('fmd-jump',${totalWithOpening})">Reveal All</button>
  </div>
  <div id="fmd-done-jump" style="${pending || !totalWithOpening ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_fmdBadge('ALL SOLDIERS DEPLOYED', 'sky')}
  </div>`;

  // HUD
  const jumpCount = pj.events.filter(e => e.type === 'heroicDive' || e.type === 'jump').length;
  const refuseCount = pj.events.filter(e => e.type === 'panicRefusal').length;
  const hudCells = `
    <div class="fmd-hud-cell"><div class="fmd-hud-val" style="color:var(--wd-paint-blue)">${jumpCount}</div><div class="fmd-hud-lbl">JUMPED</div></div>
    <div class="fmd-hud-cell"><div class="fmd-hud-val" style="color:var(--wd-paint-red)">${refuseCount}</div><div class="fmd-hud-lbl">REFUSED</div></div>
    <div class="fmd-hud-cell"><div class="fmd-hud-val" style="color:var(--wd-khaki)">10K</div><div class="fmd-hud-lbl">ALTITUDE</div></div>
  `;

  return _fmdShell(`
    <div class="fmd-hud">${hudCells}</div>
    <div class="fmd-layout">
      <div class="fmd-feed">${feed}${controls}</div>
      <div class="fmd-sidebar" id="fmd-sidebar-jump">${buildJumpSidebar(revIdx + 1)}</div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════════════
   3. PAINT BOMB (click-to-reveal per tribe)
   ═══════════════════════════════════════════════════════════════ */
export function rpBuildFullMetalDramaPaintBomb(ep) {
  const fm = ep.fullMetalDrama;
  if (!fm || !fm.paintBomb) return '';
  const pb = fm.paintBomb;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'fmd-paint';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  // Steps: opening + each tribe's events + host judge, then tribe reveal
  const steps = [];
  steps.push({ type: 'intro', html: `<div class="fmd-ev round-header">
    <div class="fmd-ev-port" style="font-size:22px;border-color:rgba(249,115,22,0.3);">&#128163;</div>
    <div style="flex:1"><div class="fmd-ev-badge orange">PHASE II &mdash; PAINT BOMB</div>
    <div class="fmd-ev-text">${pick(WAR_HOST.paintBombIntro)(host())}</div></div>
  </div>` });

  const refuserSet = new Set(fm.planeJump?.refusers || []);

  for (const tr of pb.tribes) {
    const tribeData = gs.tribes?.find(t => t.name === tr.tribe) || { members: [] };
    const active = tribeData.members.filter(m => !refuserSet.has(m));
    const sittingOut = tribeData.members.filter(m => refuserSet.has(m));

    const scoreClass = !tr.controlled ? 'uncontrolled' : tr.score > 0.4 ? 'score-high' : tr.score > 0.25 ? 'score-mid' : 'score-low';
    const paintColors = ['var(--wd-paint-red)', 'var(--wd-paint-blue)', 'var(--wd-paint-yellow)', '#84cc16', '#c084fc'];
    const numSplats = !tr.controlled ? 8 : tr.score > 0.4 ? 5 : tr.score > 0.25 ? 3 : 1;
    const splatHtml = Array.from({ length: numSplats }, (_, si) => {
      const size = 10 + Math.floor(Math.random() * 30);
      const left = Math.floor(Math.random() * 90);
      const top = Math.floor(Math.random() * 80);
      const color = paintColors[si % paintColors.length];
      const delay = si * 0.1;
      const rot = -30 + Math.floor(Math.random() * 60);
      return `<div class="fmd-splat" style="width:${size}px;height:${size}px;left:${left}%;top:${top}%;background:${color};animation-delay:${delay}s;--rot:${rot}deg"></div>`;
    }).join('');

    let tribeHtml = `<div class="fmd-ev explosive ${scoreClass}" style="border-left-color:${tr.controlled ? '#84cc16' : 'var(--wd-paint-red)'}">
      ${splatHtml}
      <div class="fmd-ev-content" style="flex:1;min-width:0">
        <div class="fmd-ev-badge ${tr.controlled ? 'green' : 'red'}">${tr.tribe} &mdash; ${tr.controlled ? 'CONTROLLED DETONATION' : '💥 UNCONTROLLED BLAST'}</div>`;

    // Show who's working on the bomb
    tribeHtml += `<div style="display:flex;gap:4px;flex-wrap:wrap;margin:6px 0">`;
    for (const m of active) {
      tribeHtml += `<div style="text-align:center;width:36px">${_fmdPortrait(m, 28)}<div style="font-size:7px;color:rgba(255,255,255,0.5)">${m.split(' ')[0]}</div></div>`;
    }
    tribeHtml += `</div>`;

    // Show who sat out
    if (sittingOut.length) {
      tribeHtml += `<div style="font-size:10px;color:#fca5a5;margin-bottom:6px">🚫 Sat out (refused to jump): ${sittingOut.join(', ')}</div>`;
    }

    // Events during bomb building
    for (const evt of (tr.events || [])) {
      const actorName = evt.player || (evt.players ? evt.players[0] : '');
      const evtColor = evt.type === 'sabotageIngredient' ? '#ef4444' : evt.type === 'accidentalMasterpiece' ? '#22c55e' : evt.type === 'chainReaction' ? '#f97316' : evt.type === 'explosivoMoment' ? '#ef4444' : evt.type === 'artisticTouch' ? '#60a5fa' : '#a8a29e';
      tribeHtml += `<div style="display:flex;gap:8px;align-items:flex-start;margin-top:6px;padding:4px 6px;background:${evtColor}11;border-left:3px solid ${evtColor};border-radius:2px">
        ${actorName ? _fmdPortrait(actorName, 24) : ''}
        <div class="fmd-ev-text" style="font-size:12px">${evt.text || ''}</div>
      </div>`;
    }

    // Host judge
    if (tr.hostJudge) {
      tribeHtml += `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed rgba(196,167,119,0.15);font-style:italic;font-size:12px;color:var(--wd-khaki)">${tr.hostJudge}</div>`;
    }

    // Score as percentage bar instead of raw decimal
    const scorePct = Math.min(100, Math.round(tr.score * 100));
    tribeHtml += `<div style="margin-top:8px">
      <div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.4)">
        <span>DETONATION SCORE</span><span>${scorePct}%</span>
      </div>
      <div style="height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden;margin-top:2px">
        <div style="height:100%;width:${scorePct}%;background:${tr.controlled ? '#84cc16' : 'var(--wd-paint-red)'};border-radius:3px"></div>
      </div>
      ${!tr.controlled ? '<div style="font-size:9px;color:var(--wd-paint-red);margin-top:3px">⚠️ Uncontrolled — 70% score penalty</div>' : ''}
    </div>`;

    tribeHtml += `</div></div>`;  // close fmd-ev-content + fmd-ev
    steps.push({ type: 'tribe', tribe: tr.tribe, html: tribeHtml });
  }

  // Winner step
  steps.push({ type: 'winner', html: `<div class="fmd-ev positive" style="text-align:center;justify-content:center;border-left-color:#84cc16">
    <div style="flex:1"><div class="fmd-ev-badge green">PHASE II WINNER</div>
    <div class="fmd-ev-text" style="font-size:15px;font-family:'Black Ops One',sans-serif;letter-spacing:2px;color:var(--wd-khaki)">${pb.winner} &mdash; MISSION ACCOMPLISHED</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px">+1 bonus trap for Capture the Flag</div>
    </div>
  </div>` });

  const totalSteps = steps.length;

  // Sidebar
  function buildPaintSidebar(revealCount) {
    let sb = `<div class="fmd-side-sec">DETONATION STATUS</div>`;
    for (let i = 0; i < pb.tribes.length; i++) {
      const tr = pb.tribes[i];
      const tribeStepIdx = i + 1;
      const shown = tribeStepIdx < revealCount;
      const tribeData = gs.tribes?.find(t => t.name === tr.tribe) || { members: [] };
      const active = tribeData.members.filter(m => !refuserSet.has(m));
      const sittingOut = tribeData.members.filter(m => refuserSet.has(m));
      const scorePct = Math.min(100, Math.round(tr.score * 100));

      sb += `<div style="padding:8px 6px;margin-bottom:6px;background:rgba(0,0,0,0.15);border-radius:4px;border-left:3px solid ${shown ? (tr.controlled ? '#84cc16' : 'var(--wd-paint-red)') : 'rgba(255,255,255,0.1)'}">
        <div style="font-family:'Black Ops One',sans-serif;font-size:10px;color:rgba(255,255,255,${shown ? 0.8 : 0.3});letter-spacing:1px">${tr.tribe} (${active.length}/${tribeData.members.length})</div>
        <div style="display:flex;gap:2px;flex-wrap:wrap;margin:4px 0">${active.map(m => _fmdPortrait(m, 20)).join('')}</div>
        ${sittingOut.length ? `<div style="font-size:8px;color:#fca5a5;margin-bottom:2px">🚫 ${sittingOut.join(', ')}</div>` : ''}
        ${shown ? `<div style="font-size:9px;color:${tr.controlled ? '#84cc16' : 'var(--wd-paint-red)'};margin-top:2px">${tr.controlled ? 'CONTROLLED' : 'UNCONTROLLED'} · ${scorePct}%</div>` : '<div style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:2px">PENDING</div>'}
      </div>`;
    }
    const winnerShown = revealCount >= totalSteps;
    sb += `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(196,167,119,0.15)">
      <div style="font-size:9px;color:rgba(196,167,119,0.5);letter-spacing:2px">PHASE WINNER</div>
      <div style="font-family:'Black Ops One',sans-serif;font-size:12px;color:${winnerShown ? 'var(--wd-khaki)' : 'rgba(255,255,255,0.2)'};margin-top:2px">${winnerShown ? pb.winner : '???'}</div>
    </div>`;
    return sb;
  }

  // Feed
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    const visible = i <= revIdx;
    feed += `<div id="fmd-step-paint-${i}" style="${visible ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="fmd-controls-paint" class="fmd-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="fmd-btn-next" onclick="fullMetalDramaRevealNext('fmd-paint',${totalSteps})">DETONATE NEXT</button>
    <button class="fmd-btn-all" onclick="fullMetalDramaRevealAll('fmd-paint',${totalSteps})">Reveal All</button>
  </div>
  <div id="fmd-done-paint" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_fmdBadge('ALL BOMBS DETONATED', 'orange')}
  </div>`;

  // HUD
  const hudCells = pb.tribes.map(tr => `
    <div class="fmd-hud-cell">
      <div class="fmd-hud-val" style="color:${tr.controlled ? '#84cc16' : 'var(--wd-paint-red)'}">${tr.score.toFixed(1)}</div>
      <div class="fmd-hud-lbl">${tr.tribe}</div>
    </div>
  `).join('') + `<div class="fmd-hud-cell"><div class="fmd-hud-val" style="color:var(--wd-explosion)">II</div><div class="fmd-hud-lbl">PHASE</div></div>`;

  return _fmdShell(`
    <div class="fmd-hud">${hudCells}</div>
    <div class="fmd-layout">
      <div class="fmd-feed">${feed}${controls}</div>
      <div class="fmd-sidebar" id="fmd-sidebar-paint">${buildPaintSidebar(revIdx + 1)}</div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════════════
   4. DRAMA BREAK (show all, consequence badges)
   ═══════════════════════════════════════════════════════════════ */
export function rpBuildFullMetalDramaDramaBreak(ep) {
  const fm = ep.fullMetalDrama;
  if (!fm || !fm.breakEvents?.length) return '';

  const badgeColorMap = {
    red: 'var(--wd-paint-red)', green: '#84cc16', blue: 'var(--wd-paint-blue)',
    gold: 'var(--wd-khaki)', orange: 'var(--wd-explosion)', pink: '#f472b6',
  };

  let feed = '';
  feed += `<div class="fmd-ev round-header" style="margin-bottom:8px">
    <div class="fmd-ev-port" style="font-size:22px;border-color:rgba(153,27,27,0.3);">&#128226;</div>
    <div style="flex:1"><div class="fmd-ev-badge red">FIELD DISPATCH &mdash; WAR DRAMA</div>
    <div class="fmd-ev-text">Between the explosions and the assault, tempers flared and alliances shifted.</div></div>
  </div>`;

  for (const evt of fm.breakEvents) {
    const borderColor = badgeColorMap[evt.badgeClass] || 'var(--wd-steel)';
    const evtClass = evt.badgeClass === 'red' ? 'negative' : evt.badgeClass === 'green' ? 'positive' : '';
    const actorName = (evt.players || [])[0] || '';

    feed += `<div class="fmd-ev ${evtClass}" style="border-left-color:${borderColor}">
      ${actorName ? `<div class="fmd-ev-port">${_fmdPortrait(actorName, 44)}</div>` : ''}
      <div style="flex:1;min-width:0">
        <div class="fmd-ev-badge ${evt.badgeClass || 'gray'}">${evt.badgeText || 'EVENT'}</div>
        <div class="fmd-ev-text">${evt.text}</div>
        ${evt.players?.length > 1 ? `<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">${evt.players.slice(1).map(n => `<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:rgba(255,255,255,0.5)">${_fmdSidePortrait(n, 20)} ${n}</div>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  // Sidebar — consequence summary
  let sidebar = `<div class="fmd-side-sec">INCIDENT REPORT</div>`;
  for (const evt of fm.breakEvents) {
    const medal = evt.badgeClass === 'gold' ? 'BRONZE STAR' : evt.badgeClass === 'green' ? 'COMMENDATION' : evt.badgeClass === 'red' ? 'DISHONORABLE' : evt.badgeClass === 'blue' ? 'STRATEGIC' : 'NOTED';
    const medalColor = evt.badgeClass === 'gold' ? 'var(--wd-khaki)' : evt.badgeClass === 'green' ? '#84cc16' : evt.badgeClass === 'red' ? 'var(--wd-paint-red)' : evt.badgeClass === 'blue' ? 'var(--wd-paint-blue)' : 'var(--wd-steel)';
    sidebar += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:10px">
      <div style="width:6px;height:6px;border-radius:50%;background:${medalColor};flex-shrink:0"></div>
      <span style="color:rgba(255,255,255,0.6);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(evt.players || []).join(', ')}</span>
      <span style="color:${medalColor};font-size:8px;letter-spacing:1px;font-family:'Black Ops One',sans-serif">${medal}</span>
    </div>`;
  }

  return _fmdShell(`
    ${_fmdBarbed}
    <div class="fmd-layout">
      <div class="fmd-feed">${feed}</div>
      <div class="fmd-sidebar">${sidebar}</div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════════════
   5. CAPTURE THE FLAG (two sub-screens: setup + assault)
   ═══════════════════════════════════════════════════════════════ */
export function rpBuildFullMetalDramaFlag(ep) {
  const fm = ep.fullMetalDrama;
  if (!fm || !fm.captureFlag) return '';
  const cf = fm.captureFlag;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'fmd-flag';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  // Build steps: setup per tribe, then each round
  const steps = [];

  // Opening
  steps.push({ type: 'intro', html: `<div class="fmd-ev round-header">
    <div class="fmd-ev-port" style="font-size:22px;border-color:rgba(34,197,94,0.3);">&#127988;</div>
    <div style="flex:1"><div class="fmd-ev-badge green">PHASE III &mdash; CAPTURE THE FLAG</div>
    <div class="fmd-ev-text">${pick(WAR_HOST.flagIntro)(host())}</div></div>
  </div>` });

  // Setup per tribe
  for (const setup of cf.setup) {
    const planBar = Math.min(100, (setup.planQuality / 0.8) * 100);
    steps.push({ type: 'setup', tribe: setup.tribe, html: `<div class="fmd-ev" style="border-left-color:var(--wd-mud)">
      <div style="flex:1;min-width:0">
        <div class="fmd-ev-badge gold">${setup.tribe} &mdash; DEFENSE SETUP</div>
        <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;font-size:12px">
          <div style="text-align:center;padding:6px 10px;background:rgba(0,0,0,0.2);border-radius:4px;border:1px solid rgba(196,167,119,0.1)">
            <div style="font-family:'Black Ops One',sans-serif;font-size:16px;color:var(--wd-khaki)">${setup.attackers}</div>
            <div style="font-size:8px;letter-spacing:2px;color:rgba(255,255,255,0.4)">ATTACKERS</div>
          </div>
          <div style="text-align:center;padding:6px 10px;background:rgba(0,0,0,0.2);border-radius:4px;border:1px solid rgba(196,167,119,0.1)">
            <div style="font-family:'Black Ops One',sans-serif;font-size:16px;color:var(--wd-steel)">${setup.defenders}</div>
            <div style="font-size:8px;letter-spacing:2px;color:rgba(255,255,255,0.4)">DEFENDERS</div>
          </div>
          <div style="text-align:center;padding:6px 10px;background:rgba(0,0,0,0.2);border-radius:4px;border:1px solid rgba(196,167,119,0.1)">
            <div style="font-family:'Black Ops One',sans-serif;font-size:16px;color:var(--wd-paint-red)">${setup.traps}</div>
            <div style="font-size:8px;letter-spacing:2px;color:rgba(255,255,255,0.4)">TRAPS</div>
          </div>
          <div style="text-align:center;padding:6px 10px;background:rgba(0,0,0,0.2);border-radius:4px;border:1px solid rgba(196,167,119,0.1)">
            <div style="font-family:'Black Ops One',sans-serif;font-size:16px;color:var(--wd-olive)">${setup.foxholes}</div>
            <div style="font-size:8px;letter-spacing:2px;color:rgba(255,255,255,0.4)">FOXHOLES</div>
          </div>
          <div style="text-align:center;padding:6px 10px;background:rgba(0,0,0,0.2);border-radius:4px;border:1px solid rgba(196,167,119,0.1)">
            <div style="font-family:'Black Ops One',sans-serif;font-size:16px;color:var(--wd-paint-blue)">${setup.sentries}</div>
            <div style="font-size:8px;letter-spacing:2px;color:rgba(255,255,255,0.4)">SENTRIES</div>
          </div>
        </div>
        <div style="margin-top:8px">
          <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:2px">PLAN QUALITY</div>
          <div style="height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${planBar}%;background:linear-gradient(90deg,var(--wd-olive),#84cc16);border-radius:3px"></div>
          </div>
        </div>
      </div>
    </div>` });
  }

  // Assault rounds
  for (const rd of cf.rounds) {
    let roundHtml = `<div class="fmd-ev round-header" style="margin-bottom:4px">
      <div style="flex:1"><div class="fmd-ev-badge red" style="animation:${rd.events.some(e => e.type === 'flagCapture') ? 'fmd-pulse 0.8s ease-in-out infinite' : 'none'}">ROUND ${rd.num} ${rd.events.some(e => e.type === 'flagCapture') ? '&mdash; FLAG CAPTURED!' : ''}</div>
      <div class="fmd-ev-text" style="font-size:11px;color:rgba(255,255,255,0.5)">${rd.attacks.length} attack${rd.attacks.length !== 1 ? 's' : ''} this round</div></div>
    </div>`;

    // Events in this round
    for (const evt of rd.events) {
      const isCapture = evt.type === 'flagCapture';
      const isTrap = evt.type === 'boobyTrapTrigger';
      const isLastStand = evt.type === 'lastStand';
      const evtClass = isCapture ? 'capture' : isTrap ? 'negative' : isLastStand ? 'positive' : '';
      const badgeText = isCapture ? 'FLAG CAPTURED' : isTrap ? 'TRAP TRIGGERED' : isLastStand ? 'LAST STAND' : evt.type === 'flankingManeuver' ? 'FLANKING MANEUVER' : evt.type === 'smokescreen' ? 'SMOKESCREEN' : evt.type === 'rallyCry' ? 'RALLY CRY' : evt.type === 'friendlyFire' ? 'FRIENDLY FIRE' : evt.type === 'numYoAttack' ? 'MARTIAL ARTS' : evt.type === 'surrenderBluff' ? 'SURRENDER BLUFF' : evt.type === 'flagRunner' ? 'FLAG RUNNER' : 'EVENT';
      const badgeColor = isCapture ? 'green' : isTrap ? 'red' : isLastStand ? 'gold' : evt.type === 'friendlyFire' ? 'red' : evt.type === 'flankingManeuver' ? 'blue' : evt.type === 'smokescreen' ? 'gray' : 'orange';
      const actorName = evt.player || (evt.players ? evt.players[0] : '');

      roundHtml += `<div class="fmd-ev ${evtClass}"${isCapture ? ' style="animation:fmd-incoming 0.5s ease-out"' : ''}>
        ${actorName ? `<div class="fmd-ev-port">${_fmdPortrait(actorName, 44)}</div>` : ''}
        <div style="flex:1;min-width:0">
          <div class="fmd-ev-badge ${badgeColor}">${badgeText}</div>
          <div class="fmd-ev-text"${isCapture ? ' style="font-size:15px;font-weight:700"' : ''}>${evt.text || ''}</div>
        </div>
      </div>`;
    }

    // Attack summary for this round
    const advances = rd.attacks.filter(a => a.advanced).length;
    const stopped = rd.attacks.filter(a => !a.advanced).length;
    roundHtml += `<div style="display:flex;gap:12px;font-size:10px;color:rgba(255,255,255,0.4);padding:4px 0 2px">
      <span style="color:#84cc16">${advances} advanced</span>
      <span style="color:var(--wd-paint-red)">${stopped} stopped</span>
    </div>`;

    steps.push({ type: 'round', num: rd.num, html: roundHtml });
  }

  // Final result
  const resultText = cf.capturedBy
    ? `FLAG CAPTURED by ${cf.capturedBy}! ${cf.winner} wins the war!`
    : `No capture after ${cf.rounds.length} rounds. ${cf.winner} wins on total advances.`;
  steps.push({ type: 'result', html: `<div class="fmd-ev capture" style="text-align:center;justify-content:center">
    <div style="flex:1"><div class="fmd-ev-badge green">MISSION COMPLETE</div>
    <div class="fmd-ev-text" style="font-size:15px;font-family:'Black Ops One',sans-serif;letter-spacing:2px;color:#84cc16">${resultText}</div></div>
  </div>` });

  const totalSteps = steps.length;

  // Sidebar — tactical map view
  function buildFlagSidebar(revealCount) {
    let sb = `<div class="fmd-side-sec">TACTICAL MAP</div>`;

    // Setup info
    for (const setup of cf.setup) {
      const setupIdx = cf.setup.indexOf(setup) + 1; // +1 for intro
      const shown = setupIdx < revealCount;
      sb += `<div style="padding:6px;margin-bottom:4px;background:rgba(0,0,0,0.15);border-radius:4px;opacity:${shown ? 1 : 0.4}">
        <div style="font-family:'Black Ops One',sans-serif;font-size:9px;color:var(--wd-khaki);letter-spacing:1px">${setup.tribe}</div>
        ${shown ? `<div style="display:flex;gap:8px;margin-top:3px;font-size:9px;color:rgba(255,255,255,0.5)">
          <span>${setup.traps} traps</span><span>${setup.foxholes} fox</span><span>${setup.sentries} snt</span>
        </div>` : '<div style="font-size:9px;color:rgba(255,255,255,0.2)">CLASSIFIED</div>'}
      </div>`;
    }

    // Round progress
    const setupCount = cf.setup.length + 1; // intro + setups
    sb += `<div class="fmd-side-sec">ASSAULT PROGRESS</div>`;
    for (const rd of cf.rounds) {
      const rdIdx = setupCount + cf.rounds.indexOf(rd);
      const shown = rdIdx < revealCount;
      const hasCapture = rd.events.some(e => e.type === 'flagCapture');
      sb += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;opacity:${shown ? 1 : 0.35}">
        <div style="width:18px;height:18px;border-radius:50%;background:${shown ? (hasCapture ? '#84cc16' : 'var(--wd-olive)') : 'rgba(255,255,255,0.1)'};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:${shown ? '#fff' : 'rgba(255,255,255,0.3)'}">${rd.num}</div>
        <span style="color:rgba(255,255,255,${shown ? 0.7 : 0.3})">${shown ? (hasCapture ? 'FLAG CAPTURED!' : `${rd.attacks.filter(a => a.advanced).length} advanced`) : 'PENDING'}</span>
      </div>`;
    }

    // Winner
    const winnerShown = revealCount >= totalSteps;
    sb += `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(196,167,119,0.15)">
      <div style="font-size:9px;color:rgba(196,167,119,0.5);letter-spacing:2px">VICTOR</div>
      <div style="font-family:'Black Ops One',sans-serif;font-size:12px;color:${winnerShown ? '#84cc16' : 'rgba(255,255,255,0.2)'};margin-top:2px">${winnerShown ? cf.winner : '???'}</div>
    </div>`;
    return sb;
  }

  // Feed
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    const visible = i <= revIdx;
    feed += `<div id="fmd-step-flag-${i}" style="${visible ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="fmd-controls-flag" class="fmd-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="fmd-btn-next" onclick="fullMetalDramaRevealNext('fmd-flag',${totalSteps})">ADVANCE!</button>
    <button class="fmd-btn-all" onclick="fullMetalDramaRevealAll('fmd-flag',${totalSteps})">Reveal All</button>
  </div>
  <div id="fmd-done-flag" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_fmdBadge('BATTLE CONCLUDED', 'green')}
  </div>`;

  // HUD
  const totalAdvances = cf.rounds.flatMap(r => r.attacks).filter(a => a.advanced).length;
  const totalStopped = cf.rounds.flatMap(r => r.attacks).filter(a => !a.advanced).length;
  const hudCells = `
    <div class="fmd-hud-cell"><div class="fmd-hud-val" style="color:#84cc16">${totalAdvances}</div><div class="fmd-hud-lbl">ADVANCED</div></div>
    <div class="fmd-hud-cell"><div class="fmd-hud-val" style="color:var(--wd-paint-red)">${totalStopped}</div><div class="fmd-hud-lbl">STOPPED</div></div>
    <div class="fmd-hud-cell"><div class="fmd-hud-val" style="color:var(--wd-khaki)">${cf.rounds.length}</div><div class="fmd-hud-lbl">ROUNDS</div></div>
    <div class="fmd-hud-cell"><div class="fmd-hud-val" style="color:var(--wd-explosion)">III</div><div class="fmd-hud-lbl">PHASE</div></div>
  `;

  return _fmdShell(`
    <div class="fmd-hud">${hudCells}</div>
    <div class="fmd-layout">
      <div class="fmd-feed">${feed}${controls}</div>
      <div class="fmd-sidebar" id="fmd-sidebar-flag">${buildFlagSidebar(revIdx + 1)}</div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════════════
   6. RESULTS — military leaderboard, winner, safe/tribal
   ═══════════════════════════════════════════════════════════════ */
export function rpBuildFullMetalDramaResults(ep) {
  const fm = ep.fullMetalDrama;
  if (!fm) return '';

  const sorted = Object.entries(fm.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerTribe = sorted[0]?.[0];
  const loserTribe = sorted[sorted.length - 1]?.[0];
  const tribeMembers = gs.tribes ? gs.tribes.map(t => ({ name: t.name, members: [...t.members] })) : [];

  // Leaderboard from chalMemberScores
  const scores = ep.chalMemberScores || {};
  const leaderboard = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  let content = '';

  // Winner announcement
  content += `<div style="text-align:center;padding:30px 20px;position:relative;z-index:6;">
    <div style="font-size:10px;letter-spacing:5px;color:rgba(196,167,119,0.4);text-transform:uppercase;margin-bottom:8px">MISSION DEBRIEF</div>
    <div style="font-family:'Black Ops One',sans-serif;font-size:32px;color:var(--wd-khaki);text-shadow:2px 2px 0 rgba(0,0,0,0.5);letter-spacing:4px;margin-bottom:6px">${winnerTribe}</div>
    <div style="font-family:'Black Ops One',sans-serif;font-size:14px;color:#84cc16;letter-spacing:3px;margin-bottom:20px">WINS THE WAR</div>
    ${pick(WAR_HOST.winner)(host(), winnerTribe) ? `<div style="font-size:13px;font-style:italic;color:rgba(255,255,255,0.6);max-width:500px;margin:0 auto 20px">${pick(WAR_HOST.winner)(host(), winnerTribe)}</div>` : ''}
  </div>`;

  content += _fmdBarbed;

  // Tribe scores
  content += `<div style="display:flex;gap:14px;justify-content:center;padding:0 14px 20px;flex-wrap:wrap;position:relative;z-index:6">`;
  for (const [tribe, score] of sorted) {
    const isWinner = tribe === winnerTribe;
    const isLoser = tribe === loserTribe;
    const members = tribeMembers.find(t => t.name === tribe)?.members || [];
    content += `<div style="flex:1;min-width:240px;max-width:400px;background:rgba(0,0,0,0.3);border:2px solid ${isWinner ? '#84cc16' : isLoser ? 'var(--wd-paint-red)' : 'rgba(196,167,119,0.15)'};border-radius:6px;padding:16px;${isWinner ? 'box-shadow:0 0 20px rgba(132,204,22,0.1)' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-family:'Black Ops One',sans-serif;font-size:14px;color:${isWinner ? '#84cc16' : isLoser ? 'var(--wd-paint-red)' : 'var(--wd-khaki)'};letter-spacing:2px">${tribe}</div>
        <div style="font-family:'Black Ops One',sans-serif;font-size:18px;color:${isWinner ? '#84cc16' : 'var(--wd-khaki)'}">${score.toFixed(1)}</div>
      </div>
      <div style="font-size:10px;letter-spacing:2px;color:${isWinner ? '#84cc16' : isLoser ? 'var(--wd-paint-red)' : 'var(--wd-steel)'};margin-bottom:10px">${isWinner ? 'SAFE &mdash; IMMUNE' : isLoser ? 'TRIBAL COUNCIL TONIGHT' : 'SAFE'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${members.map(name => {
          const memberScore = scores[name] || 0;
          const statusColor = isWinner ? '#84cc16' : isLoser ? 'var(--wd-paint-red)' : 'var(--wd-steel)';
          return _fmdIdCard(name, '', `${memberScore} pts`, statusColor);
        }).join('')}
      </div>
    </div>`;
  }
  content += `</div>`;

  // Leaderboard — top performers
  if (leaderboard.length > 0) {
    content += `<div style="padding:0 14px 20px;position:relative;z-index:6">
      <div style="font-family:'Black Ops One',sans-serif;font-size:12px;letter-spacing:3px;color:var(--wd-khaki);text-align:center;margin-bottom:12px">COMBAT LEADERBOARD</div>
      <div style="max-width:500px;margin:0 auto">`;
    const top = leaderboard.slice(0, 8);
    for (let i = 0; i < top.length; i++) {
      const [name, score] = top[i];
      const medal = i === 0 ? 'BRONZE STAR' : i === 1 ? 'SILVER STAR' : i === 2 ? 'PURPLE HEART' : '';
      const medalColor = i === 0 ? 'var(--wd-khaki)' : i === 1 ? 'var(--wd-dog-tag)' : i === 2 ? '#c084fc' : '';
      content += `<div style="display:flex;align-items:center;gap:10px;padding:6px 8px;margin-bottom:3px;background:rgba(0,0,0,${i < 3 ? 0.25 : 0.12});border-radius:4px;border-left:3px solid ${i < 3 ? medalColor : 'transparent'}">
        <div style="font-family:'Black Ops One',sans-serif;font-size:14px;color:rgba(255,255,255,0.3);width:20px;text-align:center">${i + 1}</div>
        ${_fmdSidePortrait(name, 28)}
        <div style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;color:rgba(255,255,255,0.8)">${name}</div>
        ${medal ? `<span style="font-size:7px;font-family:'Black Ops One',sans-serif;letter-spacing:1px;color:${medalColor}">${medal}</span>` : ''}
        <div style="font-family:'Black Ops One',sans-serif;font-size:13px;color:var(--wd-khaki)">${score}</div>
      </div>`;
    }
    content += `</div></div>`;
  }

  return _fmdShell(content, ep);
}

/* ═══════════════════════════════════════════════════════════════
   REVEAL FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

function _fmdBuildJumpSidebarFromEp(ep, revIdx) {
  const fm = ep.fullMetalDrama;
  if (!fm || !fm.planeJump) return '';
  const pj = fm.planeJump;
  const steps = pj.events || [];
  const totalSteps = steps.length;
  const revealed = steps.slice(0, Math.max(0, revIdx)); // revIdx includes the opening step at 0
  const jumpedSet = new Set(revealed.filter(e => e.type === 'heroicDive' || e.type === 'jump' || e.type === 'tandemJump' || e.type === 'cornedBeefLure').map(e => e.player).filter(Boolean));
  const refusedSet = new Set(revealed.filter(e => e.type === 'panicRefusal').map(e => e.player).filter(Boolean));
  const mentionedSet = new Set([...jumpedSet, ...refusedSet]);

  let sb = '';
  sb += `<div class="fmd-side-sec">ALTITUDE: 10,000 FT</div>`;
  sb += `<div style="height:8px;background:rgba(0,0,0,0.3);border-radius:4px;overflow:hidden;margin:6px 0 10px">
    <div style="height:100%;width:${Math.min(100, (revIdx / Math.max(1, totalSteps + 1)) * 100)}%;background:linear-gradient(90deg,var(--wd-paint-blue),#38bdf8);border-radius:4px;transition:width 0.3s"></div>
  </div>`;
  for (const [tribe, order] of Object.entries(pj.jumpOrder || {})) {
    sb += `<div class="fmd-side-sec">${tribe}</div>`;
    for (const name of order) {
      const jumped = jumpedSet.has(name);
      const refused = refusedSet.has(name);
      const known = mentionedSet.has(name);
      const icon = !known ? '&#10067;' : jumped ? '&#9989;' : refused ? '&#128020;' : '&#10067;';
      sb += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;color:rgba(255,255,255,${known ? 0.8 : 0.3});opacity:${known ? 1 : 0.4}">
        ${_fmdSidePortrait(name, 24)}
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</span>
        <span>${icon}</span>
      </div>`;
    }
  }
  return sb;
}

function _fmdBuildPaintSidebarFromEp(ep, revIdx) {
  const fm = ep.fullMetalDrama;
  if (!fm || !fm.paintBomb) return '';
  const pb = fm.paintBomb;
  const totalSteps = pb.tribes.length + 2; // intro + tribes + winner

  let sb = `<div class="fmd-side-sec">DETONATION STATUS</div>`;
  for (let i = 0; i < pb.tribes.length; i++) {
    const tr = pb.tribes[i];
    const shown = (i + 1) <= revIdx;
    sb += `<div style="padding:8px 6px;margin-bottom:4px;background:rgba(0,0,0,0.15);border-radius:4px;border-left:3px solid ${shown ? (tr.controlled ? '#84cc16' : 'var(--wd-paint-red)') : 'rgba(255,255,255,0.1)'};opacity:${shown ? 1 : 0.4}">
      <div style="font-family:'Black Ops One',sans-serif;font-size:10px;color:rgba(255,255,255,${shown ? 0.8 : 0.3});letter-spacing:1px">${tr.tribe}</div>
      ${shown ? `<div style="font-size:9px;color:${tr.controlled ? '#84cc16' : 'var(--wd-paint-red)'};margin-top:2px">${tr.controlled ? 'CONTROLLED' : 'UNCONTROLLED'} &middot; ${tr.score.toFixed(2)} pts</div>` : '<div style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:2px">PENDING</div>'}
    </div>`;
  }
  const winnerShown = revIdx >= totalSteps - 1;
  sb += `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(196,167,119,0.15)">
    <div style="font-size:9px;color:rgba(196,167,119,0.5);letter-spacing:2px">PHASE WINNER</div>
    <div style="font-family:'Black Ops One',sans-serif;font-size:12px;color:${winnerShown ? 'var(--wd-khaki)' : 'rgba(255,255,255,0.2)'};margin-top:2px">${winnerShown ? pb.winner : '???'}</div>
  </div>`;
  return sb;
}

function _fmdBuildFlagSidebarFromEp(ep, revIdx) {
  const fm = ep.fullMetalDrama;
  if (!fm || !fm.captureFlag) return '';
  const cf = fm.captureFlag;
  const setupCount = cf.setup.length + 1;
  const totalSteps = setupCount + cf.rounds.length + 1;

  let sb = `<div class="fmd-side-sec">TACTICAL MAP</div>`;
  for (const setup of cf.setup) {
    const setupIdx = cf.setup.indexOf(setup) + 1;
    const shown = setupIdx <= revIdx;
    sb += `<div style="padding:6px;margin-bottom:4px;background:rgba(0,0,0,0.15);border-radius:4px;opacity:${shown ? 1 : 0.4}">
      <div style="font-family:'Black Ops One',sans-serif;font-size:9px;color:var(--wd-khaki);letter-spacing:1px">${setup.tribe}</div>
      ${shown ? `<div style="display:flex;gap:8px;margin-top:3px;font-size:9px;color:rgba(255,255,255,0.5)">
        <span>${setup.traps} traps</span><span>${setup.foxholes} fox</span><span>${setup.sentries} snt</span>
      </div>` : '<div style="font-size:9px;color:rgba(255,255,255,0.2)">CLASSIFIED</div>'}
    </div>`;
  }
  sb += `<div class="fmd-side-sec">ASSAULT PROGRESS</div>`;
  for (const rd of cf.rounds) {
    const rdIdx = setupCount + cf.rounds.indexOf(rd);
    const shown = rdIdx <= revIdx;
    const hasCapture = rd.events.some(e => e.type === 'flagCapture');
    sb += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;opacity:${shown ? 1 : 0.35}">
      <div style="width:18px;height:18px;border-radius:50%;background:${shown ? (hasCapture ? '#84cc16' : 'var(--wd-olive)') : 'rgba(255,255,255,0.1)'};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:${shown ? '#fff' : 'rgba(255,255,255,0.3)'}">${rd.num}</div>
      <span style="color:rgba(255,255,255,${shown ? 0.7 : 0.3})">${shown ? (hasCapture ? 'FLAG CAPTURED!' : `${rd.attacks.filter(a => a.advanced).length} advanced`) : 'PENDING'}</span>
    </div>`;
  }
  const winnerShown = revIdx >= totalSteps - 1;
  sb += `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(196,167,119,0.15)">
    <div style="font-size:9px;color:rgba(196,167,119,0.5);letter-spacing:2px">VICTOR</div>
    <div style="font-family:'Black Ops One',sans-serif;font-size:12px;color:${winnerShown ? '#84cc16' : 'rgba(255,255,255,0.2)'};margin-top:2px">${winnerShown ? cf.winner : '???'}</div>
  </div>`;
  return sb;
}

function _fmdUpdateSidebar(screenKey, revIdx) {
  const ep = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  if (!ep?.fullMetalDrama) return;
  if (screenKey === 'fmd-jump') {
    const sideEl = document.getElementById('fmd-sidebar-jump');
    if (sideEl) sideEl.innerHTML = _fmdBuildJumpSidebarFromEp(ep, revIdx);
  } else if (screenKey === 'fmd-paint') {
    const sideEl = document.getElementById('fmd-sidebar-paint');
    if (sideEl) sideEl.innerHTML = _fmdBuildPaintSidebarFromEp(ep, revIdx);
  } else if (screenKey === 'fmd-flag') {
    const sideEl = document.getElementById('fmd-sidebar-flag');
    if (sideEl) sideEl.innerHTML = _fmdBuildFlagSidebarFromEp(ep, revIdx);
  }
}

export function fullMetalDramaRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('fmd-', '');
  const el = document.getElementById(`fmd-step-${suffix}-${state.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`fmd-controls-${suffix}`);
    const done = document.getElementById(`fmd-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
  _fmdUpdateSidebar(screenKey, state.idx);
}

export function fullMetalDramaRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('fmd-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`fmd-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`fmd-controls-${suffix}`);
  const done = document.getElementById(`fmd-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
  _fmdUpdateSidebar(screenKey, state.idx);
}

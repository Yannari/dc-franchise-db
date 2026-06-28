// js/chal/top-dog.js — Top Dog animal buddy challenge (post-merge)
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

function canScheme(name) {
  const a = arch(name);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
  if (nice.includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════════════════════════════════════════════
// ANIMAL POOL
// ══════════════════════════════════════════════════════════════
export const ANIMALS = [
  // Danger 1 — easy to handle
  { id: 'hamster', name: 'Hamster', danger: 1, temperament: 'skittish', stats: ['social', 'mental'], icon: '🐹' },
  { id: 'parrot', name: 'Parrot', danger: 1, temperament: 'cunning', stats: ['mental', 'intuition'], icon: '🦜' },
  { id: 'rabbit', name: 'Rabbit', danger: 1, temperament: 'gentle', stats: ['social', 'loyalty'], icon: '🐇' },
  // Danger 2 — manageable
  { id: 'raccoon', name: 'Raccoon', danger: 2, temperament: 'clever', stats: ['strategic', 'intuition'], icon: '🦝' },
  { id: 'chameleon', name: 'Chameleon', danger: 2, temperament: 'lazy', stats: ['endurance', 'mental'], icon: '🦎' },
  { id: 'fox', name: 'Fox', danger: 2, temperament: 'sly', stats: ['strategic', 'social'], icon: '🦊' },
  { id: 'otter', name: 'Otter', danger: 2, temperament: 'mischievous', stats: ['boldness', 'social'], icon: '🦦' },
  // Danger 3 — moderate
  { id: 'monkey', name: 'Monkey', danger: 3, temperament: 'playful', stats: ['boldness', 'social'], icon: '🐒' },
  { id: 'goat', name: 'Goat', danger: 3, temperament: 'stubborn', stats: ['physical', 'endurance'], icon: '🐐' },
  { id: 'wolf', name: 'Wolf', danger: 3, temperament: 'loyal', stats: ['loyalty', 'boldness'], icon: '🐺' },
  { id: 'horse', name: 'Horse', danger: 3, temperament: 'spirited', stats: ['physical', 'loyalty'], icon: '🐴' },
  { id: 'hawk', name: 'Hawk', danger: 3, temperament: 'focused', stats: ['intuition', 'strategic'], icon: '🦅' },
  // Danger 4 — risky
  { id: 'eagle', name: 'Eagle', danger: 4, temperament: 'proud', stats: ['strategic', 'boldness'], icon: '🦅' },
  { id: 'alligator', name: 'Alligator', danger: 4, temperament: 'aggressive', stats: ['physical', 'boldness'], icon: '🐊' },
  { id: 'bear', name: 'Bear', danger: 4, temperament: 'lazy', stats: ['endurance', 'physical'], icon: '🐻' },
  { id: 'bull', name: 'Bull', danger: 4, temperament: 'volatile', stats: ['physical', 'boldness'], icon: '🐂' },
  // Danger 5 — extreme
  { id: 'shark', name: 'Shark', danger: 5, temperament: 'aggressive', stats: ['boldness', 'physical'], icon: '🦈' },
  { id: 'moose', name: 'Moose', danger: 5, temperament: 'stubborn', stats: ['physical', 'endurance'], icon: '🫎' },
  { id: 'python', name: 'Python', danger: 5, temperament: 'patient', stats: ['endurance', 'intuition'], icon: '🐍' },
];

// ══════════════════════════════════════════════════════════════
// ANIMAL MOOD ENGINE
// ══════════════════════════════════════════════════════════════
const TEMPERAMENT_TABLE = {
  skittish: {
    reactions: {
      training_success: +0.5, training_failure: -0.5, training_critical_failure: -1.5,
      social_bond: +0.3, social_rivalry: -1, social_showmance: +0.3, social_blame: -0.5,
      encounter_success: +0.5, encounter_failure: -1, mole_sabotage: -1,
      judging_high: +0.5, judging_low: -0.5,
    },
    uniqueTriggers: {
      startle: { delta: -0.8, chance: 0.25, text: (p, a, pr) => `${a.name} freezes mid-trick, ears flat — something spooked ${pr.obj}. ${p} has to coax ${pr.obj} back with treats and whispers.` },
    },
    canRefuse: false,
    refuseText: null,
  },
  cunning: {
    reactions: {
      training_success: +0.3, training_failure: +0.2, training_critical_failure: -0.3,
      social_bond: +0.3, social_rivalry: +0.5, social_showmance: +0.2, social_blame: -0.2,
      encounter_success: +0.5, encounter_failure: +0.3, mole_sabotage: -0.3,
      judging_high: +0.3, judging_low: +0.2,
    },
    uniqueTriggers: {
      outsmart: { delta: +1, chance: 0.2, text: (p, a, pr) => `${a.name} bypasses the obstacle entirely — found a shortcut nobody else saw. ${p}: "Did ${pr.sub} just... outsmart the COURSE?"` },
    },
    canRefuse: false,
    refuseText: null,
  },
  clever: {
    reactions: {
      training_success: +0.3, training_failure: -0.3, training_critical_failure: -0.8,
      social_bond: +0.3, social_rivalry: -0.3, social_showmance: +0.2, social_blame: -0.5,
      encounter_success: +0.5, encounter_failure: -0.5, mole_sabotage: -0.5,
      judging_high: +0.5, judging_low: -0.8,
    },
    uniqueTriggers: {
      bored: { delta: -0.6, chance: 0.2, text: (p, a, pr) => `${a.name} yawns mid-routine. The trick is beneath ${pr.obj}. ${p}: "Come ON, we practiced this!" ${a.name} gives ${p} a look of pure condescension.` },
    },
    canRefuse: false,
    refuseText: null,
  },
  lazy: {
    reactions: {
      training_success: +0.5, training_failure: +0.1, training_critical_failure: -0.3,
      social_bond: +0.5, social_rivalry: -0.2, social_showmance: +0.5, social_blame: -0.2,
      encounter_success: +0.3, encounter_failure: -0.3, mole_sabotage: -0.3,
      judging_high: +0.3, judging_low: 0,
    },
    uniqueTriggers: {
      nap: { delta: -0.4, chance: 0.3, text: (p, a, pr) => `${a.name} lies down. Mid-challenge. Just... lies down. ${p} tugs the leash. Nothing. ${host()}: "Is it... dead?" ${p}: "No. Just lazy."` },
    },
    canRefuse: false,
    refuseText: null,
  },
  playful: {
    reactions: {
      training_success: +0.5, training_failure: +0.3, training_critical_failure: +0.1,
      social_bond: +0.5, social_rivalry: +0.2, social_showmance: +0.5, social_blame: -0.3,
      encounter_success: +0.5, encounter_failure: +0.2, mole_sabotage: -0.5,
      judging_high: +0.5, judging_low: +0.2,
    },
    uniqueTriggers: {
      zoomies: { delta: +0.8, chance: 0.25, text: (p, a, pr) => `${a.name} gets the ZOOMIES — sprinting in circles, bouncing off walls, pure chaos energy. ${p} can't stop laughing. The audience loves it.` },
    },
    canRefuse: false,
    refuseText: null,
  },
  stubborn: {
    reactions: {
      training_success: +0.3, training_failure: -0.3, training_critical_failure: -0.5,
      social_bond: +0.2, social_rivalry: +0.3, social_showmance: +0.1, social_blame: +0.2,
      encounter_success: +0.3, encounter_failure: -0.2, mole_sabotage: -0.3,
      judging_high: +0.3, judging_low: -0.2,
    },
    uniqueTriggers: {
      digIn: { delta: +0.8, chance: 0.2, text: (p, a, pr) => `${p} tries to redirect the ${a.name}. It plants its hooves and REFUSES. ${p} pulls. Nothing. ${p} gives up and tries a different approach. The ${a.name} snorts — it just trained ITS trainer.` },
    },
    canRefuse: true,
    refuseText: [
      (p, a, pr) => `${a.name} sits down and WON'T MOVE. ${p} begs, bribes, threatens — nothing. The ${a.name} has decided this is over. ${host()}: "Looks like ${p}'s partner has gone on STRIKE."`,
      (p, a, pr) => `${a.name} turns around and walks the OTHER direction. ${p} follows, desperately trying to redirect. The ${a.name} does not care about ${p}'s feelings. Or immunity.`,
      (p, a, pr) => `${p}: "COME ON!" ${a.name}: *nothing*. Absolutely nothing. A statue with attitude. ${host()}: "That ${a.name.toLowerCase()} is NOT having it."`,
    ],
  },
  loyal: {
    reactions: {
      training_success: +0.5, training_failure: -0.2, training_critical_failure: -0.5,
      social_bond: +0.5, social_rivalry: -0.5, social_showmance: +0.5, social_blame: -0.5,
      encounter_success: +0.5, encounter_failure: -0.3, mole_sabotage: -0.8,
      judging_high: +0.5, judging_low: -0.3,
    },
    uniqueTriggers: {
      protect: { delta: +1, chance: 0.2, text: (p, a, pr) => `${a.name} growls at someone who got too close to ${p}. Hackles up, teeth bared. ${p} puts a hand on ${pr.posAdj} head: "Easy. They're fine." The ${a.name} doesn't break eye contact with the threat.` },
    },
    canRefuse: false,
    refuseText: null,
  },
  proud: {
    reactions: {
      training_success: +0.5, training_failure: -0.8, training_critical_failure: -1.5,
      social_bond: +0.2, social_rivalry: -0.3, social_showmance: +0.2, social_blame: -0.8,
      encounter_success: +0.5, encounter_failure: -0.8, mole_sabotage: -0.8,
      judging_high: +1, judging_low: -1.5,
    },
    uniqueTriggers: {
      preen: { delta: +0.8, chance: 0.2, text: (p, a, pr) => `${a.name} spreads its wings and STRUTS. Pure superiority. It knows it's winning. ${p} matches the energy — chin up, shoulders back. Alpha energy radiating from both of them.` },
    },
    canRefuse: true,
    refuseText: [
      (p, a, pr) => `${a.name} REFUSES. Not out of stubbornness — out of DIGNITY. This performance is beneath ${pr.obj}. ${p}: "Please?" ${a.name}: *turns away with visible contempt*`,
      (p, a, pr) => `${a.name} won't perform. The crowd is watching and ${pr.sub} will NOT be seen doing a mediocre trick. Better to refuse than to fail publicly. ${p} is left standing alone on stage.`,
      (p, a, pr) => `${a.name} hisses at the obstacle. How DARE they ask royalty to do THIS. ${p} tries to coax ${pr.obj}. ${a.name} flares and walks off. ${host()}: "That is one PROUD animal."`,
    ],
  },
  aggressive: {
    reactions: {
      training_success: +0.3, training_failure: -0.3, training_critical_failure: -0.5,
      social_bond: +0.2, social_rivalry: +0.8, social_showmance: 0, social_blame: +0.3,
      encounter_success: +0.5, encounter_failure: +0.3, mole_sabotage: +0.5,
      judging_high: +0.3, judging_low: +0.3,
    },
    uniqueTriggers: {
      rampage: { delta: +0.5, chance: 0.2, text: (p, a, pr) => `${a.name} SNAPS at a nearby obstacle and destroys it. Splinters everywhere. ${p}: "WHOA—" ${host()}: "We needed that!" ${a.name} doesn't care. ${a.name} is FIRED UP now.` },
    },
    canRefuse: true,
    refuseText: [
      (p, a, pr) => `${a.name} SNARLS and lunges at the equipment. Not performing — ATTACKING. ${p} barely holds on. ${host()}: "WHOA! Control your animal!" ${p}: "I'M TRYING!"`,
      (p, a, pr) => `${a.name} won't do the trick. Instead it bares its teeth at the judges. Chef backs up. ${host()} backs up. ${p} is left alone with a furious ${a.name.toLowerCase()}. This is not going well.`,
      (p, a, pr) => `${a.name} goes after a crew member's sandwich instead of performing. Total chaos. ${p} tackles ${pr.obj} mid-lunge. ${host()}: "That's... that's NOT the trick."`,
    ],
  },
  gentle: {
    reactions: {
      training_success: +0.5, training_failure: -0.3, training_critical_failure: -0.8,
      social_bond: +0.8, social_rivalry: -0.8, social_showmance: +0.5, social_blame: -0.5,
      encounter_success: +0.5, encounter_failure: -0.5, mole_sabotage: -1,
      judging_high: +0.5, judging_low: -0.3,
    },
    uniqueTriggers: {
      cuddle: { delta: +1, chance: 0.25, text: (p, a, pr) => `${a.name} hops into ${p}'s lap and nuzzles against ${pr.posAdj} chest. ${p} melts. The entire crew melts. ${host()}: "We're ALL crying. This is FINE."` },
    },
    canRefuse: false,
    refuseText: null,
  },
  sly: {
    reactions: {
      training_success: +0.3, training_failure: +0.1, training_critical_failure: -0.3,
      social_bond: +0.3, social_rivalry: +0.3, social_showmance: +0.2, social_blame: 0,
      encounter_success: +0.5, encounter_failure: +0.2, mole_sabotage: -0.2,
      judging_high: +0.3, judging_low: +0.2,
    },
    uniqueTriggers: {
      sneak: { delta: +0.8, chance: 0.2, text: (p, a, pr) => `${a.name} disappears. ${p} panics — then sees it on the other side of the obstacle, already past it. It found a hidden shortcut. ${p}: "You beautiful sneaky genius."` },
    },
    canRefuse: false,
    refuseText: null,
  },
  mischievous: {
    reactions: {
      training_success: +0.5, training_failure: +0.3, training_critical_failure: +0.1,
      social_bond: +0.5, social_rivalry: +0.3, social_showmance: +0.3, social_blame: -0.2,
      encounter_success: +0.5, encounter_failure: +0.2, mole_sabotage: -0.3,
      judging_high: +0.5, judging_low: +0.3,
    },
    uniqueTriggers: {
      prank: { delta: +0.5, chance: 0.3, text: (p, a, pr) => `${a.name} steals someone's hat and runs a lap with it. Pure chaos. ${p} is mortified. The audience is DYING. ${host()}: "That otter is better TV than half the cast."` },
    },
    canRefuse: false,
    refuseText: null,
  },
  spirited: {
    reactions: {
      training_success: +0.5, training_failure: -0.5, training_critical_failure: -0.8,
      social_bond: +0.3, social_rivalry: -0.3, social_showmance: +0.3, social_blame: -0.3,
      encounter_success: +0.8, encounter_failure: -0.5, mole_sabotage: -0.5,
      judging_high: +0.5, judging_low: -0.5,
    },
    uniqueTriggers: {
      charge: { delta: +1, chance: 0.2, text: (p, a, pr) => `${a.name} REARS UP and gallops forward at full speed. ${p} grabs the mane and holds on. For three glorious seconds, they're FLYING. ${host()}: "THAT is what this challenge is ABOUT!"` },
    },
    canRefuse: false,
    refuseText: null,
  },
  focused: {
    reactions: {
      training_success: +0.3, training_failure: -0.5, training_critical_failure: -1,
      social_bond: +0.2, social_rivalry: -0.2, social_showmance: +0.1, social_blame: -0.3,
      encounter_success: +0.5, encounter_failure: -0.5, mole_sabotage: -0.5,
      judging_high: +0.5, judging_low: -0.8,
    },
    uniqueTriggers: {
      lockOn: { delta: +0.8, chance: 0.2, text: (p, a, pr) => `${a.name}'s eyes narrow. It spots the target. Everything else vanishes. Pure predator focus. ${p} feels the intensity shift. "Go." It goes.` },
    },
    canRefuse: false,
    refuseText: null,
  },
  volatile: {
    reactions: {
      training_success: +0.8, training_failure: -0.8, training_critical_failure: -1.5,
      social_bond: +0.5, social_rivalry: +0.5, social_showmance: +0.3, social_blame: +0.3,
      encounter_success: +0.8, encounter_failure: -0.8, mole_sabotage: +0.5,
      judging_high: +1, judging_low: -1,
    },
    uniqueTriggers: {
      snap: { delta: -1, chance: 0.25, text: (p, a, pr) => `${a.name} SNAPS without warning — charges the obstacle, smashes it, snorts at the debris. ${p} dives out of the way. One second calm, next second FURY. ${host()}: "That bull is UNHINGED."` },
    },
    canRefuse: true,
    refuseText: [
      (p, a, pr) => `${a.name} stamps the ground, nostrils flaring. It's not doing THIS. ${p} backs away slowly. Smart. ${host()}: "I think the ${a.name.toLowerCase()} is about to charge the JUDGES."`,
      (p, a, pr) => `${a.name} looks at the trick, looks at ${p}, and SNORTS. Then turns around. Tail facing the audience. ${p}: "That's... not the trick." ${host()}: "No. No it is not."`,
      (p, a, pr) => `${a.name} won't move. Won't respond. Just stands there vibrating with barely contained rage. ${p} is afraid to touch ${pr.obj}. Everyone is afraid.`,
    ],
  },
  patient: {
    reactions: {
      training_success: +0.3, training_failure: 0, training_critical_failure: -0.3,
      social_bond: +0.2, social_rivalry: -0.2, social_showmance: +0.1, social_blame: -0.1,
      encounter_success: +0.3, encounter_failure: -0.2, mole_sabotage: -0.3,
      judging_high: +0.3, judging_low: -0.2,
    },
    uniqueTriggers: {
      coil: { delta: +0.5, chance: 0.2, text: (p, a, pr) => `${a.name} coils slowly, methodically. Everyone watches, frozen. Then it STRIKES — perfect execution. The trick is done before anyone blinks. ${p}: "...Did that just happen?"` },
    },
    canRefuse: false,
    refuseText: null,
  },
};

function _getTemperament(animal) {
  return TEMPERAMENT_TABLE[animal.temperament] || TEMPERAMENT_TABLE.playful;
}

function _initMood(compatibility) {
  return Math.max(1, Math.min(5, Math.round(compatibility * 0.4 + 1)));
}

function _moodShift(assign, eventType, context) {
  const temper = _getTemperament(assign.animal);
  const delta = temper.reactions[eventType] || 0;
  if (delta === 0) return 0;
  const prev = assign.mood;
  assign.mood = Math.max(1, Math.min(5, assign.mood + delta));
  if (!assign.moodLog) assign.moodLog = [];
  assign.moodLog.push({ event: eventType, delta, from: prev, to: assign.mood, context: context || '' });
  return delta;
}

function _moodDecay(assign) {
  if (assign.mood === 3) return;
  const prev = assign.mood;
  if (assign.mood > 3) assign.mood = Math.max(3, assign.mood - 0.5);
  else assign.mood = Math.min(3, assign.mood + 0.5);
  assign.mood = Math.round(assign.mood * 2) / 2;
  if (!assign.moodLog) assign.moodLog = [];
  assign.moodLog.push({ event: 'decay', delta: assign.mood - prev, from: prev, to: assign.mood, context: 'phase transition' });
}

function _moodEffect(assign) {
  const m = assign.mood;
  if (m >= 5) return 1.25;
  if (m >= 4) return 1.1;
  if (m >= 3) return 1.0;
  if (m >= 2) return 0.85;
  return 0.65;
}

function _checkRefusal(assign) {
  const temper = _getTemperament(assign.animal);
  if (!temper.canRefuse || assign.mood > 1) return null;
  if (Math.random() < 0.6) {
    const text = pick(temper.refuseText)(assign.player, assign.animal, pronouns(assign.player));
    return text;
  }
  return null;
}

function _checkUniqueTrigger(assign, phase) {
  const temper = _getTemperament(assign.animal);
  const entries = Object.entries(temper.uniqueTriggers || {});
  for (const [id, trigger] of entries) {
    if (Math.random() < trigger.chance) {
      const prev = assign.mood;
      assign.mood = Math.max(1, Math.min(5, assign.mood + trigger.delta));
      if (!assign.moodLog) assign.moodLog = [];
      assign.moodLog.push({ event: `unique_${id}`, delta: trigger.delta, from: prev, to: assign.mood, context: phase });
      const text = trigger.text(assign.player, assign.animal, pronouns(assign.player));
      return { id, text, delta: trigger.delta };
    }
  }
  return null;
}

function _moodLabel(mood) {
  if (mood >= 5) return 'Ecstatic';
  if (mood >= 4) return 'Happy';
  if (mood >= 3) return 'Neutral';
  if (mood >= 2) return 'Unhappy';
  return 'Furious';
}

function _moodFaceClass(mood) {
  if (mood >= 5) return 'td-face-ecstatic';
  if (mood >= 4) return 'td-face-happy';
  if (mood >= 3) return 'td-face-neutral';
  if (mood >= 2) return 'td-face-unhappy';
  return 'td-face-furious';
}

function _moodMeter(mood, animalName) {
  const pct = ((mood - 1) / 4) * 100;
  const barCls = mood >= 4 ? 'td-mood-high' : mood >= 3 ? 'td-mood-mid' : 'td-mood-low';
  const faceCls = _moodFaceClass(mood);
  return `<div class="td-mood-wrap">
    <div class="td-mood-face ${faceCls}"></div>
    <div class="td-mood-bar-bg"><div class="td-mood-bar ${barCls}" style="width:${pct}%"></div></div>
    <span class="td-mood-label">${_moodLabel(mood)}</span>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// COMPATIBILITY
// ══════════════════════════════════════════════════════════════
function _calcCompatibility(name, animal) {
  const s = pStats(name);
  const base = 2 + (s[animal.stats[0]] + s[animal.stats[1]]) * 0.25;
  let bonus = 0;
  const a = arch(name);

  // archetype synergy
  if (['villain', 'mastermind', 'schemer'].includes(a) && ['aggressive', 'cunning'].includes(animal.temperament)) bonus += 1.5;
  if (a === 'hero' && ['loyal', 'playful'].includes(animal.temperament)) bonus += 1.5;
  if (a === 'social-butterfly') bonus += 0.8;
  if (a === 'challenge-beast' && animal.stats.includes('physical')) bonus += 1;
  if (a === 'loyal-soldier' && animal.temperament === 'loyal') bonus += 1.2;
  if (a === 'chaos-agent' && animal.temperament === 'playful') bonus += 1;
  if (a === 'wildcard') bonus += noise(3);
  if (a === 'underdog' && animal.danger <= 2) bonus += 1;
  if (a === 'showmancer' && ['skittish', 'playful', 'gentle'].includes(animal.temperament)) bonus += 1;
  if (a === 'perceptive-player' && ['focused', 'patient', 'sly'].includes(animal.temperament)) bonus += 1;
  if (a === 'hothead' && ['spirited', 'volatile'].includes(animal.temperament)) bonus += 1;
  if (['villain', 'schemer'].includes(a) && animal.temperament === 'sly') bonus += 1;
  if (a === 'chaos-agent' && animal.temperament === 'mischievous') bonus += 1.2;

  // archetype clashes — softer penalties
  if (a === 'goat' && animal.danger >= 4) bonus -= 1.5;
  if (['hero', 'loyal-soldier'].includes(a) && animal.temperament === 'aggressive') bonus -= 1;
  if (a === 'underdog' && animal.danger >= 4) bonus -= 1;
  if (['villain', 'schemer'].includes(a) && animal.temperament === 'loyal') bonus -= 0.5;
  if (a === 'floater' && animal.temperament === 'stubborn') bonus -= 0.5;
  if (a === 'goat' && animal.temperament === 'volatile') bonus -= 1;
  if (a === 'underdog' && animal.temperament === 'aggressive') bonus -= 0.5;
  if (a === 'showmancer' && animal.temperament === 'volatile') bonus -= 1;

  // danger tax — mild
  if (animal.danger >= 4) bonus -= 0.5;
  if (animal.danger >= 5) bonus -= 0.5;

  return Math.max(1, Math.min(10, base + bonus + noise(2)));
}

// ══════════════════════════════════════════════════════════════
// ANIMAL ASSIGNMENT
// ══════════════════════════════════════════════════════════════
function _assignAnimals(active) {
  const pool = [...ANIMALS].sort(() => Math.random() - 0.5);
  const shuffledPlayers = [...active].sort(() => Math.random() - 0.5);
  const assignments = [];

  for (let i = 0; i < shuffledPlayers.length; i++) {
    const name = shuffledPlayers[i];
    const animal = pool[i % pool.length];
    const compat = _calcCompatibility(name, animal);
    assignments.push({
      player: name,
      animal,
      compatibility: compat,
      mood: _initMood(compat),
      moodLog: [],
      reactionText: _assignReaction(name, animal, compat),
    });
  }

  return assignments;
}

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — ASSIGNMENT REACTIONS
// ══════════════════════════════════════════════════════════════
export const ASSIGN_REACTION = {
  highCompat: {
    skittish: [
      (p, a, pr) => `${p} kneels down gently and extends a hand. The ${a.name} sniffs cautiously... then nuzzles ${pr.posAdj} palm. ${p}: "Oh. Oh, we're gonna be FRIENDS."`,
      (p, a, pr) => `The ${a.name} trembles for a moment, then scrambles up ${p}'s arm and nestles in ${pr.posAdj} hood. ${host()}: "That was... adorable." ${p}: "I've been chosen."`,
      (p, a, pr) => `${p} whispers softly to the ${a.name}. It calms immediately. ${pr.Sub} has a gift. The other players stare, impressed.`,
      (p, a, pr) => `The ${a.name} takes one look at ${p} and relaxes completely. Instant trust. ${p}: "Animals know good people." ${host()}: "Debatable."`,
    ],
    cunning: [
      (p, a, pr) => `${p} locks eyes with the ${a.name}. It tilts its head. ${p} tilts ${pr.posAdj} head. They're already scheming together. ${host()}: "I don't like this."`,
      (p, a, pr) => `The ${a.name} cocks its head sideways and squawks something. ${p} nods like ${pr.sub} understood it. Maybe ${pr.sub} did. These two are dangerous.`,
      (p, a, pr) => `${p} offers a treat. The ${a.name} takes it, then steals another from ${p}'s pocket. ${p} laughs. "I respect the hustle."`,
      (p, a, pr) => `The ${a.name} immediately starts mimicking ${p}'s gestures. Two tricksters in perfect sync. Everyone else is worried.`,
    ],
    clever: [
      (p, a, pr) => `${p} sets up a simple puzzle. The ${a.name} solves it in three seconds. ${p}: "Oh, you're SMART smart." The ${a.name} washes its hands smugly.`,
      (p, a, pr) => `The ${a.name} looks at ${p}, then at the treat, then at the locked box. It picks the lock. ${p}: "I LOVE this animal." ${host()}: "That was... concerning."`,
      (p, a, pr) => `${p} and the ${a.name} size each other up. Mutual recognition. Two strategists who see the board the same way. This team is going far.`,
      (p, a, pr) => `The ${a.name} unzips ${p}'s backpack, rummages through it, and brings back exactly the treat ${p} was looking for. ${p}: "You're hired."`,
    ],
    lazy: [
      (p, a, pr) => `${p} sits down next to the ${a.name}. It doesn't move. ${p} doesn't move. They vibe in silence for thirty seconds. ${host()}: "Is... is that bonding?" It is.`,
      (p, a, pr) => `The ${a.name} yawns. ${p} yawns. They're already synchronized. Low-energy powerhouse. Chef: "They're perfect for each other."`,
      (p, a, pr) => `${p} offers a treat. The ${a.name} doesn't bother getting up — just opens its mouth expectantly. ${p} hand-delivers it. "We have an understanding."`,
      (p, a, pr) => `${p} scratches the ${a.name}'s chin. It melts into a puddle of contentment. ${p}: "Same, buddy. Same."`,
    ],
    playful: [
      (p, a, pr) => `The ${a.name} LAUNCHES itself at ${p}. ${p} catches it — barely. It immediately starts grooming ${pr.posAdj} hair. ${p}: "Okay! Okay, we're doing this!"`,
      (p, a, pr) => `${p} tosses a ball. The ${a.name} catches it, throws it back. ${p} catches it. They've invented a game in three seconds flat. ${host()}: "This is sickeningly cute."`,
      (p, a, pr) => `The ${a.name} steals ${p}'s hat and runs a lap. ${p} chases it, laughing. The other castmates can't help but smile. These two are a match.`,
      (p, a, pr) => `${p} makes a face. The ${a.name} makes a face back. ${p} dances. It dances. They're in their own world. ${host()} is forgotten.`,
    ],
    stubborn: [
      (p, a, pr) => `${p} tries to lead the ${a.name}. It doesn't move. ${p} pulls harder. Nothing. Then ${p} stops pulling and starts asking nicely. The ${a.name} follows. ${p}: "Noted."`,
      (p, a, pr) => `The ${a.name} butts ${p}'s leg — hard. ${p} butts it back — gently. Mutual respect established through headbutt protocol. ${host()}: "That's one way to bond."`,
      (p, a, pr) => `${p} and the ${a.name} have a staring contest. ${p} blinks first. The ${a.name} snorts victoriously. ${p}: "Fine. You're the boss."`,
      (p, a, pr) => `The ${a.name} plants its feet and refuses to acknowledge ${p}. ${p} sits down and waits. After five minutes, it walks over on its own terms. Stubborn respects patient.`,
    ],
    loyal: [
      (p, a, pr) => `The ${a.name} walks straight to ${p} and sits at ${pr.posAdj} feet. No hesitation. Chosen. ${p}: "...Did it just pick ME?" ${host()}: "Looks like it."`,
      (p, a, pr) => `${p} kneels. The ${a.name} puts its head in ${pr.posAdj} hands. The bond is instant. ${p}'s eyes go soft. "I won't let you down."`,
      (p, a, pr) => `The ${a.name} follows ${p} around the clearing, staying exactly two steps behind. Loyal from moment one. The other animals aren't this trusting.`,
      (p, a, pr) => `${p} extends a hand. The ${a.name} licks it, then presses its forehead against ${pr.posAdj} palm. Silent oath. ${host()}: "I'm not crying, YOU'RE crying." Chef: "I'm crying."`,
    ],
    proud: [
      (p, a, pr) => `The ${a.name} spreads its wings / strikes a pose. ${p} strikes a matching pose. Two alphas acknowledging each other. ${host()}: "The ego in this clearing is SUFFOCATING."`,
      (p, a, pr) => `${p} doesn't approach the ${a.name}. ${pr.Sub} waits. The ${a.name} circles once, twice, then lands beside ${pr.obj}. Royalty recognizes royalty.`,
      (p, a, pr) => `The ${a.name} looks down at ${p} imperiously. ${p} looks up with equal confidence. "We're going to win this." The ${a.name} preens. Agreement.`,
      (p, a, pr) => `${p} bows slightly. The ${a.name}'s eyes sharpen — respect is the correct currency. It steps forward. Partnership accepted.`,
    ],
    aggressive: [
      (p, a, pr) => `The ${a.name} SNARLS at everyone — except ${p}. ${p} walks right up to it. "Easy. I'm on your side." It stops snarling. ${host()}: "How are you NOT dead?!"`,
      (p, a, pr) => `${p} feeds the ${a.name} raw meat. It devours it and looks at ${p} with what might be gratitude. Or hunger. Hard to tell. But they've bonded.`,
      (p, a, pr) => `The ${a.name} lunges. ${p} doesn't flinch. They lock eyes. The ${a.name} backs off. First time it's backed down all day. ${p}: "We understand each other."`,
      (p, a, pr) => `${p} scratches the ${a.name} behind the ears. It rumbles dangerously — then leans into it. A killer with a soft spot. ${p} found it.`,
    ],
    gentle: [
      (p, a, pr) => `The ${a.name} hops right into ${p}'s arms. No hesitation. Just trust. ${p}: "Oh my GOD you are the CUTEST thing." ${host()}: "This is disgusting. I love it."`,
      (p, a, pr) => `${p} kneels down. The ${a.name} puts its tiny paws on ${pr.posAdj} knee and looks up. ${p}'s heart SHATTERS. The other players are jealous.`,
      (p, a, pr) => `The ${a.name} nudges ${p}'s hand, asking for pets. ${p} obliges. For the next thirty seconds, the world doesn't exist. Just ${p} and the ${a.name}.`,
      (p, a, pr) => `${p} whispers gently. The ${a.name} tilts its head, ears up, completely calm. Instant bond. ${host()}: "Some people are just... animal people."`,
    ],
    sly: [
      (p, a, pr) => `The ${a.name} watches ${p} from the corner of its eye. ${p} watches back. A slow grin spreads across ${p}'s face. "You're a schemer. I LIKE schemers."`,
      (p, a, pr) => `${p} sets a treat on the ground. The ${a.name} takes it — and leaves a pinecone in its place. A TRADE. ${p}: "Did... did it just barter with me?" ${host()}: "That fox is smarter than most of you."`,
      (p, a, pr) => `The ${a.name} circles ${p} once, twice, then sits directly behind ${p} — watching everything. ${p}: "I have a bodyguard." More like a spy.`,
      (p, a, pr) => `${p} offers a treat. The ${a.name} sniffs it, looks at ${p}'s other hand, and steals the SECOND treat instead. ${p}: "Respect."`,
    ],
    mischievous: [
      (p, a, pr) => `The ${a.name} immediately steals ${p}'s water bottle, opens it, and drinks from it upside down. Water everywhere. ${p}: "You're INSANE." ${pr.Sub} is laughing. This is going to be chaotic.`,
      (p, a, pr) => `${p} reaches out. The ${a.name} high-fives ${pr.obj}. ACTUALLY high-fives. ${p}: "DID EVERYONE SEE THAT?!" ${host()}: "...How did it know how to do that?"`,
      (p, a, pr) => `The ${a.name} slides across the floor into ${p}'s lap. Gets up, runs a circle, slides back. ${p} is IN LOVE. ${host()}: "That otter has more personality than half the cast."`,
      (p, a, pr) => `${p} and the ${a.name} are already causing problems. It knocked over Chef's cooler. ${p} is pretending it wasn't ${pr.posAdj} animal. It absolutely was.`,
    ],
    spirited: [
      (p, a, pr) => `The ${a.name} stamps and tosses its mane. ${p} approaches without fear. One hand on its neck. It calms. ${p}: "Easy. We're going to be great together." The ${a.name} snorts in agreement.`,
      (p, a, pr) => `${p} swings up onto the ${a.name}'s back in one smooth motion. It rears slightly — testing. ${p} holds steady. The ${a.name} settles. Partnership formed.`,
      (p, a, pr) => `The ${a.name} circles the clearing at full speed, then skids to a stop right in front of ${p}. Breathing hard, eyes bright. ${p}: "Show-off." ${pr.Sub} is impressed.`,
      (p, a, pr) => `${p} runs alongside the ${a.name}. It matches ${pr.posAdj} pace perfectly. Neither leads. Neither follows. Equals. ${host()}: "I've never seen a horse take to someone this fast."`,
    ],
    focused: [
      (p, a, pr) => `The ${a.name}'s eyes lock onto ${p}. No blinking. No movement. Just pure attention. ${p} makes a hand gesture. The ${a.name} follows it EXACTLY. ${host()}: "That's unsettling."`,
      (p, a, pr) => `${p} holds up a target. The ${a.name} tracks it with laser precision. When ${p} throws it, the ${a.name} catches it mid-air. Zero wasted motion. ${p}: "We're going to WIN this."`,
      (p, a, pr) => `The ${a.name} ignores everything — other animals, other people, the cameras. Just watches ${p}. When ${p} moves, it moves. Shadow and subject.`,
      (p, a, pr) => `${p} gives a command. The ${a.name} executes it perfectly on the first try. ${p} gives another. Perfect again. ${host()}: "Is that bird a ROBOT?"`,
    ],
    volatile: [
      (p, a, pr) => `The ${a.name} charges ${p}. ${p} sidesteps — barely — and it thunders past. Then it circles back, calmer. ${p}: "Okay. Okay. We're doing this YOUR way." Smart.`,
      (p, a, pr) => `${p} approaches with both hands up. The ${a.name} snorts, stomps — then lets ${p} touch its forehead. A fragile truce. ${host()}: "That is the BRAVEST thing I've seen on this show."`,
      (p, a, pr) => `The ${a.name} destroyed three obstacles before ${p} got near it. But when ${p} finally makes contact, something shifts. The rage focuses. Into partnership. Maybe.`,
      (p, a, pr) => `${p} feeds the ${a.name} slowly. It eats. Snorts. Eats more. ${p}: "We're not friends. But we have an agreement." The ${a.name} stamps once. Agreement confirmed.`,
    ],
    patient: [
      (p, a, pr) => `The ${a.name} doesn't move. ${p} doesn't move. They wait. And wait. Then, slowly, the ${a.name} uncurls and rests its head near ${p}'s hand. Trust — earned through stillness.`,
      (p, a, pr) => `${p} sits cross-legged on the ground. The ${a.name} slides closer. Inch by inch. Five minutes later, it's draped across ${p}'s lap. ${host()}: "That was the most peaceful thing I've ever seen. I'm bored. But it was peaceful."`,
      (p, a, pr) => `The ${a.name} regards ${p} with ancient, unblinking eyes. ${p} holds steady. After a long moment, it flicks its tongue. Approval. ${p}: "I'll take it."`,
      (p, a, pr) => `${p} places a treat down. The ${a.name} doesn't move for thirty seconds. Then, in one strike, it's gone. The precision is terrifying. ${p}: "Note to self: don't annoy the snake."`,
    ],
  },
  lowCompat: {
    skittish: [
      (p, a, pr) => `${p} reaches for the ${a.name}. It BOLTS. Up a tree. Into a bush. Under a rock. ${p}: "Come back!" It does not come back. ${host()}: "That's going well."`,
      (p, a, pr) => `The ${a.name} takes one look at ${p} and hides in a bucket. ${p} tips the bucket. It hides in a SMALLER bucket. ${host()}: "There's a metaphor here."`,
      (p, a, pr) => `Every time ${p} moves, the ${a.name} flinches. ${p} breathes too loud. It flinches again. This is going to be a LONG challenge.`,
      (p, a, pr) => `${p}: "Come here, little buddy." The ${a.name} screams. Just... screams. ${p}: "I haven't even touched you." More screaming. ${host()} winces.`,
    ],
    cunning: [
      (p, a, pr) => `The ${a.name} steals ${p}'s shoes. Both of them. While ${p} is looking right at it. ${p}: "How?! I was WATCHING!" ${host()}: "It's smarter than you."`,
      (p, a, pr) => `${p} tries to bribe the ${a.name} with treats. It takes the treats AND the bag. And ${p}'s hat. And walks away. ${p} has been robbed.`,
      (p, a, pr) => `The ${a.name} mimics ${p}'s voice mockingly. The other castmates laugh. ${p} does NOT laugh. This animal is ${pr.posAdj} nemesis now.`,
      (p, a, pr) => `${p} sets up a training obstacle. The ${a.name} dismantles it for parts. Uses the parts to build a nest. Falls asleep in the nest. ${p}: "I can't even be mad."`,
    ],
    clever: [
      (p, a, pr) => `The ${a.name} solves the puzzle box before ${p} even explains the rules. Then looks at ${p} with palpable disappointment. ${host()}: "Your animal thinks you're dumb."`,
      (p, a, pr) => `${p} gives a command. The ${a.name} does the opposite. Perfectly. It understood — it just disagrees. ${p}: "You're doing this on PURPOSE."`,
      (p, a, pr) => `The ${a.name} opens the treat jar, eats half, closes it, and pushes it back. It maintains eye contact with ${p} the entire time. Power move.`,
      (p, a, pr) => `${p} tries hand signals. The ${a.name} watches patiently, then walks the OTHER direction. ${p}: "That was clearly 'come here!'" It was. The ${a.name} knows.`,
    ],
    lazy: [
      (p, a, pr) => `${p}: "Okay, let's train!" The ${a.name} is asleep. ${p} pokes it. Still asleep. ${p} claps. Dead asleep. ${p}: "It's literally UNCONSCIOUS." ${host()}: "Same energy."`,
      (p, a, pr) => `The ${a.name} refuses to stand up. ${p} tries treats, threats, music. Nothing. It opens one eye, judges ${p}, and closes it again. Devastating.`,
      (p, a, pr) => `${p} carries the ${a.name} to the training area. It goes limp. Complete dead weight. ${p}: "Work with me here!" It yawns. It will not work with ${p}.`,
      (p, a, pr) => `The ${a.name} lies across the training obstacle and falls asleep ON it. ${p} can't even use the equipment now. ${host()}: "That's a strategy."`,
    ],
    playful: [
      (p, a, pr) => `The ${a.name} thinks everything is a game. EVERYTHING. ${p} gives a command — it does a backflip instead. ${p}: "That's impressive but NOT what I asked."`,
      (p, a, pr) => `${p} tries to be serious. The ${a.name} pulls ${pr.posAdj} shoelaces. ${p} tries again. It pulls the OTHER shoelace. ${p}: "STOP HAVING FUN."`,
      (p, a, pr) => `The ${a.name} plays keep-away with the training baton. ${p} chases it for three full minutes. The other castmates are in tears laughing. ${p} is NOT amused.`,
      (p, a, pr) => `${p} demonstrates a trick. The ${a.name} demonstrates a DIFFERENT trick. Its trick is better. ${p} is being upstaged by an animal. ${host()}: "Whose challenge is this?"`,
    ],
    stubborn: [
      (p, a, pr) => `The ${a.name} will not move. Not for treats. Not for praise. Not for threats. ${p} pushes it. It pushes BACK. ${p} falls over. ${host()}: "The ${a.name} wins round one."`,
      (p, a, pr) => `${p}: "SIT." It stands. "STAND." It sits. "COME." It leaves. This animal is fluent in spite. ${p}: "I'm being trolled by a ${a.name.toLowerCase()}."`,
      (p, a, pr) => `The ${a.name} headbutts ${p}'s knee. ${p}: "OW." It headbutts the other knee. ${p}: "WHY." It looks satisfied. Dominance established. Not in ${p}'s favor.`,
      (p, a, pr) => `${p} tries a different approach. Calm. Gentle. Patient. The ${a.name} eats ${pr.posAdj} training notes. Chews slowly. Maintains eye contact. ${p}: "Message received."`,
    ],
    loyal: [
      (p, a, pr) => `The ${a.name} looks at ${p}. Looks at the next person. Looks back at ${p}. Walks to the next person. ${p}: "Did I just get REJECTED by a ${a.name.toLowerCase()}?"`,
      (p, a, pr) => `${p} offers a treat. The ${a.name} sniffs it suspiciously. Sniffs ${p}. Does not approve. Sits with its back to ${p}. ${host()}: "That's harsh."`,
      (p, a, pr) => `The ${a.name} follows someone ELSE around instead of ${p}. ${p} tugs the leash gently. It sighs. It comes. It radiates disappointment. ${p}: "You wound me."`,
      (p, a, pr) => `${p} tries to pet the ${a.name}. It tolerates it the way one tolerates a dentist visit. Eyes elsewhere. Counting the seconds. ${p}: "I feel so loved."`,
    ],
    proud: [
      (p, a, pr) => `The ${a.name} looks at ${p} and is visibly unimpressed. It turns away. ${p}: "What did I DO?" Nothing. That's the problem. Royalty expects tribute.`,
      (p, a, pr) => `${p} approaches the ${a.name} too casually. It recoils. A peasant dared to approach without bowing. ${p} is confused. The ${a.name} is offended. ${host()}: "You blew it."`,
      (p, a, pr) => `The ${a.name} accepts ${p}'s offering — then drops it on the ground. Not good enough. ${p} tries again. Dropped again. ${p}: "What DO you want?!" It wants BETTER.`,
      (p, a, pr) => `${p} makes a sudden move. The ${a.name} spreads its wings/raises up to full height. ${p} backs away. "Okay. Okay. YOU'RE in charge. Got it."`,
    ],
    aggressive: [
      (p, a, pr) => `The ${a.name} HISSES at ${p}. ${p} jumps back. ${host()}: "Maybe don't make eye contact." ${p} looks away. It hisses again. ${p}: "WHAT DID I DO?!"`,
      (p, a, pr) => `${p} approaches carefully. The ${a.name} snaps. ${p}'s sleeve is torn. ${p}: "That was my FAVORITE shirt!" It lunges again. ${p} runs. ${host()}: "This is GREAT TV."`,
      (p, a, pr) => `The ${a.name} growls every time ${p} breathes. ${p} holds ${pr.posAdj} breath. Still growls. ${p}: "You just hate me." It does. It really, really does.`,
      (p, a, pr) => `${p} tries the "alpha stance." The ${a.name} responds with actual aggression. ${p} abandons the alpha stance. ${p}: "I am NOT the alpha. Message received."`,
    ],
    gentle: [
      (p, a, pr) => `The ${a.name} sniffs ${p}'s hand and recoils softly. Not scared — just... unimpressed. ${p} tries again. A tiny nose wiggle. ${p}: "That's basically a handshake, right?" It is not.`,
      (p, a, pr) => `${p} picks up the ${a.name}. It goes limp in ${pr.posAdj} arms — not trusting, just resigned. ${p}: "Work with me here, buddy." The ${a.name} sighs. Actually sighs.`,
      (p, a, pr) => `The ${a.name} lets ${p} hold it but won't look at ${pr.obj}. Eyes elsewhere. Always elsewhere. ${p}: "Am I THAT boring?" ${host()}: "Maybe."`,
      (p, a, pr) => `${p} sets down a treat. The ${a.name} approaches, sniffs, and pushes it back. It wants affection, not bribery. ${p} doesn't realize this yet. ${p}: "What's WRONG with the treat?!"`,
    ],
    sly: [
      (p, a, pr) => `The ${a.name} watches ${p} from behind a rock. ${p} watches back. Neither moves. ${host()}: "This is a staring contest now?" The ${a.name} wins. It always wins.`,
      (p, a, pr) => `${p} reaches for the ${a.name}. It sidesteps. ${p} reaches again. Another sidestep. ${p} lunges. It's somehow behind ${p} now. ${p}: "HOW?!"`,
      (p, a, pr) => `The ${a.name} steals ${p}'s training whistle and buries it. ${p} spends three minutes looking. The ${a.name} digs it up. Buries it again. This is a game to it.`,
      (p, a, pr) => `${p} tries treats. The ${a.name} takes the treat from ${p}'s hand without ${p} noticing. ${p} looks down — empty hand. ${p}: "Did you just PICKPOCKET me?"`,
    ],
    mischievous: [
      (p, a, pr) => `The ${a.name} unties ${p}'s shoelaces. Both shoes. While ${p} is talking to ${host()}. ${p} takes a step — faceplant. The ${a.name} CHATTERS with delight.`,
      (p, a, pr) => `${p} puts on a training glove. The ${a.name} steals the OTHER glove and drops it in a puddle. ${p}: "WHY." The ${a.name} dives into the puddle after it. Splashes ${p}.`,
      (p, a, pr) => `The ${a.name} squirts water at ${p}. Where did it GET water?! ${p}: "You're an ${a.name.toLowerCase()}, not a SQUIRT GUN." It does it again. ${host()} is dying laughing.`,
      (p, a, pr) => `${p} sets up the training obstacle carefully. The ${a.name} waits until it's perfect, then knocks it over. Watches ${p} rebuild. Knocks it over again. ${p}: "This is PERSONAL."`,
    ],
    spirited: [
      (p, a, pr) => `The ${a.name} rears up dramatically when ${p} approaches. ${p} stumbles back. ${host()}: "It's not attacking — it's just... a lot." The ${a.name} stomps for emphasis.`,
      (p, a, pr) => `${p} reaches for the reins. The ${a.name} tosses its head and paces. Too much energy. WAY too much energy. ${p}: "Can you be still for ONE second?" No.`,
      (p, a, pr) => `The ${a.name} bolts in a circle around the training area. ${p} holds the lead rope and spins like a top. ${host()}: "That's not training, that's a rodeo."`,
      (p, a, pr) => `${p} tries calm authority. The ${a.name} responds with a whinny that shakes the rafters. ${p}: "OKAY, you have OPINIONS." Very loud opinions.`,
    ],
    focused: [
      (p, a, pr) => `The ${a.name} stares at ${p} with unblinking intensity. ${p} shifts nervously. It tracks every micro-movement. ${p}: "You're... studying me, aren't you." It is.`,
      (p, a, pr) => `${p} offers a treat. The ${a.name} ignores the treat entirely and studies ${p}'s face. Then turns away. It has drawn its conclusions. ${p}: "Did I just fail an interview?"`,
      (p, a, pr) => `The ${a.name} watches the OTHER trainers, not ${p}. Learning. Cataloguing. When ${p} tries to engage, it returns its gaze with unmistakable boredom. ${p}: "Am I not INTERESTING enough?"`,
      (p, a, pr) => `${p} gives a command. The ${a.name} tilts its head, processes, and does nothing. Not defiance — evaluation. It has decided ${p}'s command was suboptimal. ${p}: "I'm being judged."`,
    ],
    volatile: [
      (p, a, pr) => `The ${a.name} snorts. ${p} flinches. The ${a.name} stomps. ${p} jumps back. ${host()}: "It hasn't even DONE anything yet." ${p}: "You don't feel the ENERGY coming off this thing?!"`,
      (p, a, pr) => `${p} approaches. The ${a.name} swings its head. ${p} ducks. ${p}: "Was that a warning?!" The ${a.name} snorts again. Everything is a warning. ${host()}: "Good luck with that."`,
      (p, a, pr) => `The ${a.name} charges the fence. Stops inches short. ${p}'s heart stops too. ${host()}: "That was a TEST." ${p}: "A test of WHAT?!" ${host()}: "Whether you'd flinch. You did."`,
      (p, a, pr) => `${p} extends a hand slowly. The ${a.name} considers biting it. Decides not to. FOR NOW. ${p} feels the mercy and withdraws. ${p}: "We'll try again... later. Much later."`,
    ],
    patient: [
      (p, a, pr) => `The ${a.name} coils perfectly still and watches ${p} approach. And approach. And approach. ${p} waits for a reaction. None comes. ${p}: "Are you... alive?" One slow blink. Yes.`,
      (p, a, pr) => `${p} tries commands. The ${a.name} absorbs them. Processes them. Does nothing. ${p} tries again. More absorbing. Zero output. ${p}: "You're buffering. The ${a.name.toLowerCase()} is BUFFERING."`,
      (p, a, pr) => `The ${a.name} lets ${p} do anything — hold, move, reposition. Zero resistance, zero cooperation. Like handling a very long, very heavy rope. ${p}: "Am I training it or CARRYING it?"`,
      (p, a, pr) => `${p} waits for the ${a.name} to do something. The ${a.name} waits for ${p} to do something. They wait together. ${host()}: "Someone has to go first." Neither does.`,
    ],
  },
};

function _assignReaction(name, animal, compat) {
  const pr = pronouns(name);
  const pool = compat >= 5.5
    ? (ASSIGN_REACTION.highCompat[animal.temperament] || ASSIGN_REACTION.highCompat.playful)
    : (ASSIGN_REACTION.lowCompat[animal.temperament] || ASSIGN_REACTION.lowCompat.stubborn);
  return pick(pool)(name, animal, pr);
}

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — TRAINING
// ══════════════════════════════════════════════════════════════
export const TRAINING_TEXT = {
  success: {
    skittish: [
      (p, a, pr) => `${p} coaxes the ${a.name} through the trick with infinite patience. It works! The ${a.name} peeks out from behind ${pr.posAdj} leg, proud of itself.`,
      (p, a, pr) => `Gentle whispers from ${p}. The ${a.name}'s ears perk up. It does the trick — shaking slightly, but perfectly. ${p}: "That's my brave baby."`,
      (p, a, pr) => `${p} builds a tiny obstacle course out of treats. The ${a.name} follows the trail nervously and completes the trick. Progress!`,
      (p, a, pr) => `The ${a.name} finally trusts ${p} enough to perform without flinching. It's a small miracle. ${p} tears up a little. "I'm not crying."`,
    ],
    cunning: [
      (p, a, pr) => `${p} and the ${a.name} work out a system of blinks and nods. The trick goes flawlessly. These two share a brain cell. A devious brain cell.`,
      (p, a, pr) => `The ${a.name} invents a shortcut for the trick that ${p} didn't teach. It works BETTER than the original plan. ${p}: "I'm learning from YOU at this point."`,
      (p, a, pr) => `${p} signals. The ${a.name} executes. Crisp. Clean. Like they've rehearsed for years, not minutes. ${host()}: "That's unsettlingly smooth."`,
      (p, a, pr) => `The ${a.name} watches ${p}'s demonstration once. Repeats it perfectly. ${p}: "Did you just... learn that in one try?" It did. Show-off.`,
    ],
    clever: [
      (p, a, pr) => `${p} shows the trick once. The ${a.name} does it twice — forward AND backward. ${host()}: "Your animal is smarter than you." ${p}: "I know. I KNOW."`,
      (p, a, pr) => `The ${a.name} figures out the trick by watching OTHER animals fail first. Pure analytical genius. ${p} just points and it performs.`,
      (p, a, pr) => `${p}: "Okay, so you go left, then—" The ${a.name} is already done. ${p}: "How did you... I didn't even finish the sentence."`,
      (p, a, pr) => `Patient repetition pays off. The ${a.name} nails the trick, then adds a flourish ${p} never taught. Overachiever.`,
    ],
    lazy: [
      (p, a, pr) => `${p} waits. And waits. The ${a.name} finally decides it's worth the effort. Does the trick in the most energy-efficient way possible. Still counts!`,
      (p, a, pr) => `The ${a.name} performs the trick lying down. ${host()}: "Is that... allowed?" ${p}: "It got the result!" Technically correct. The best kind of correct.`,
      (p, a, pr) => `${p} uses the one motivator that works: a nap afterwards. The ${a.name} does the trick at speed, then immediately falls asleep. Contract fulfilled.`,
      (p, a, pr) => `After much persuasion, the ${a.name} does one perfect rep. ONE. Then looks at ${p} like "we're done, right?" ${p}: "...Sure. We're done."`,
    ],
    playful: [
      (p, a, pr) => `${p} turns the trick into a game. The ${a.name} LOVES games. It does the trick five times in a row, each time more dramatic than the last.`,
      (p, a, pr) => `The ${a.name} nails the trick then does a victory dance. ${p} joins in. Training has devolved into a dance party. But the trick was learned, so... success?`,
      (p, a, pr) => `${p} and the ${a.name} high-five. Actually HIGH-FIVE. ${host()}: "Did that ${a.name.toLowerCase()} just..." It did. It absolutely did.`,
      (p, a, pr) => `The ${a.name} does the trick mid-backflip. Show-off. ${p} applauds wildly. "DO IT AGAIN!" It does. With a spin this time.`,
    ],
    stubborn: [
      (p, a, pr) => `${p} finally finds the right tone of voice. Firm but respectful. The ${a.name} considers the command... and obeys. ${p}: "THANK you."`,
      (p, a, pr) => `Breakthrough! The ${a.name} and ${p} reach an agreement. The trick is performed on the ${a.name}'s terms, but it's performed. Stubbornness channeled into discipline.`,
      (p, a, pr) => `${p} earns it the hard way. Twenty failed attempts. But attempt twenty-one is PERFECT. The ${a.name} snorts, almost impressed. Almost.`,
      (p, a, pr) => `${p} stops giving orders and starts making requests. The ${a.name} respects the shift. Does the trick. Once. On its own timeline. That's the deal.`,
    ],
    loyal: [
      (p, a, pr) => `${p} asks once. The ${a.name} does it. No hesitation. No argument. Loyalty is a stat and this animal has it maxed. ${p}: "Good ${a.name.toLowerCase()}."`,
      (p, a, pr) => `The ${a.name} watches ${p}'s face for the slightest cue. A nod. The trick is done before ${p} finishes the command. Wordless trust.`,
      (p, a, pr) => `${p} and the ${a.name} are in sync. Command, execute, treat. Repeat. It's beautiful in its simplicity. ${host()}: "They make it look easy."`,
      (p, a, pr) => `The ${a.name} nails the trick AND guards ${p}'s bag while doing it. Multi-tasking loyalty. ${p}: "You're the best partner I've ever had."`,
    ],
    proud: [
      (p, a, pr) => `${p} presents the trick as a challenge worthy of the ${a.name}'s dignity. It accepts. Executes with FLAIR. Because of course it does. Royalty doesn't do things halfway.`,
      (p, a, pr) => `The ${a.name} performs the trick like it invented the trick. Head high. Movements precise. ${p} is just the handler. The ${a.name} is the STAR.`,
      (p, a, pr) => `${p} frames every command as a suggestion. The ${a.name} graciously accepts. The trick is performed magnificently. On the ${a.name}'s own timeline.`,
      (p, a, pr) => `Applause. The ${a.name} needs applause. ${p} claps. The ${a.name} does the trick and poses afterward. ${host()}: "That ${a.name.toLowerCase()} wants an agent."`,
    ],
    aggressive: [
      (p, a, pr) => `${p} channels the ${a.name}'s aggression into the trick. SLAM. CRASH. The trick is done. Destructively. But done. ${host()}: "That's... one way to do it."`,
      (p, a, pr) => `The ${a.name} does the trick while growling. The entire time. Every second. But it DOES the trick. Fear is a motivator for everyone watching.`,
      (p, a, pr) => `${p} earns the ${a.name}'s respect through sheer stubbornness. The trick is performed with raw power. Not elegant. Terrifying. But effective.`,
      (p, a, pr) => `Meat-based bribery. The ${a.name} does the trick, gets a chunk of raw steak, does it again. ${p} is running out of steak. But the training is working.`,
    ],
    gentle: [
      (p, a, pr) => `${p} scratches behind the ${a.name}'s ears. Something clicks. The ${a.name} nuzzles ${pr.posAdj} hand and does the trick, softly, carefully, perfectly. ${p}: "There you go, sweetheart."`,
      (p, a, pr) => `Quiet patience wins. ${p} waits. The ${a.name} approaches on its own terms. Does the trick unprompted. ${host()}: "That's... genuinely sweet."`,
      (p, a, pr) => `${p} speaks in a whisper. The ${a.name}'s ears rotate forward. It hops through the trick course delicately — each movement precise, gentle, intentional. ${p}: "That's my good buddy."`,
      (p, a, pr) => `The ${a.name} does the trick while leaning against ${p}'s leg for comfort. Not the most independent performance, but the trust is there. ${host()}: "My heart."`,
    ],
    sly: [
      (p, a, pr) => `${p} hides a treat in a puzzle box. The ${a.name} solves it in three seconds AND does the trick as a victory lap. ${host()}: "It's toying with you." ${p}: "I know. I'm okay with it."`,
      (p, a, pr) => `The ${a.name} does the trick — but modifies it. Slicker. Smoother. Better than the version ${p} taught. ${p}: "Did you just... improve my choreography?" Yes. Significantly.`,
      (p, a, pr) => `${p} and the ${a.name} develop a secret signal system. Nose twitch = go. Ear flick = stop. The trick runs like a covert operation. ${host()}: "What am I watching?"`,
      (p, a, pr) => `The ${a.name} performs the trick while making it look effortless. Almost bored. Like it's doing ${p} a FAVOR. Which it is. ${p}: "Thank you for your service."`,
    ],
    mischievous: [
      (p, a, pr) => `${p} makes the trick a competition against another team. The ${a.name}'s eyes light up. It does the trick AND splashes the other team's animal on the way back. ${p}: "I didn't teach that part."`,
      (p, a, pr) => `The ${a.name} adds sound effects to the trick. Squeaks, chirps, chatters. The audience is in stitches. ${p} plays along. ${host()}: "This is a COMEDY act now."`,
      (p, a, pr) => `${p} discovers the ${a.name} responds to dares. "Bet you can't do a spin." It does THREE spins. "Bet you can't do the trick backward." It does. Show-off.`,
      (p, a, pr) => `The ${a.name} does the trick perfectly — then splashes in a puddle for the curtain call. ${p} gets soaked. The ${a.name} is delighted. ${p}: "Worth it. We NAILED that."`,
    ],
    spirited: [
      (p, a, pr) => `${p} lets the ${a.name} run first. Burn off the energy. THEN the trick. It works — the ${a.name} is focused for exactly twelve seconds. Long enough. The trick is EXPLOSIVE.`,
      (p, a, pr) => `The ${a.name} does the trick at full gallop. It wasn't supposed to be done at full gallop. But it works BETTER at full gallop. ${host()}: "That was INTENSE."`,
      (p, a, pr) => `${p} matches the ${a.name}'s energy instead of fighting it. They run the trick together — both sprinting, both shouting. ${host()}: "That's not training. That's a stampede."`,
      (p, a, pr) => `Raw power. The ${a.name} performs with a physicality that shakes the ground. ${p} hangs on. The trick is done in half the expected time. ${host()}: "That was TERRIFYINGLY fast."`,
    ],
    focused: [
      (p, a, pr) => `${p} gives the command once. The ${a.name} processes for two seconds. Then executes with surgical precision. Zero wasted movement. ${host()}: "That ${a.name.toLowerCase()} is a machine."`,
      (p, a, pr) => `The ${a.name} watches ${p}'s demonstration with terrifying intensity. Then replicates it EXACTLY. Same timing. Same angles. ${p}: "Are you a recording device?"`,
      (p, a, pr) => `No noise. No flair. The ${a.name} does the trick like it's a math equation — inputs, outputs, solved. ${host()}: "Efficient." ${p}: "Scary, but efficient."`,
      (p, a, pr) => `${p} points. The ${a.name} locks on. The trick is performed with zero hesitation and zero personality. Clinical. Perfect. ${p}: "You scare me a little. In a good way."`,
    ],
    volatile: [
      (p, a, pr) => `${p} catches the ${a.name} in a GOOD mood. The trick is performed with shocking grace. Powerful. Controlled. ${p}: "WHERE was this energy earlier?!" It's mood-dependent. Obviously.`,
      (p, a, pr) => `The ${a.name} channels its fury into the trick. STOMP. SLAM. DONE. ${p} is shaking. The audience is shaking. But the trick is complete. ${host()}: "That was... primal."`,
      (p, a, pr) => `${p} triggers the ${a.name}'s competitive side by pointing at another team. "They said you CAN'T do it." The ${a.name} DEMOLISHES the trick. ${p}: "Noted: anger is fuel."`,
      (p, a, pr) => `A moment of perfect calm. The ${a.name}'s mood swings into focus. The trick is done beautifully. ${p} doesn't breathe until it's over. ${host()}: "That was a WINDOW. And you nailed it."`,
    ],
    patient: [
      (p, a, pr) => `${p} waits. The ${a.name} waits. ${p} waits longer. The ${a.name} finally moves — slowly, deliberately, perfectly. The trick takes four times longer than anyone else's. But it's flawless.`,
      (p, a, pr) => `The ${a.name} uncoils. Stretches. Positions. Executes. Each movement takes an eternity. But each movement is PERFECT. ${p}: "Slow and steady. Literally." ${host()}: "I fell asleep and woke up to perfection."`,
      (p, a, pr) => `${p} learns to match the ${a.name}'s pace. Stop rushing. Let it breathe. The trick comes naturally — unhurried, precise, elegant. ${host()}: "That was zen."`,
      (p, a, pr) => `The ${a.name} does the trick on its own timeline. ${p} stands back and lets it happen. The result is the smoothest performance of the day. Patience rewarded.`,
    ],
  },
  failure: {
    skittish: [
      (p, a, pr) => `${p} claps to get the ${a.name}'s attention. It PANICS. Runs. Hides. Training set back by ten minutes. ${p}: "I clapped. I JUST clapped."`,
      (p, a, pr) => `A leaf falls. The ${a.name} flees. ${p} chases it for two minutes. Returns winded. The ${a.name} is back where it started. No progress.`,
      (p, a, pr) => `${p} moves too fast. The ${a.name}'s eyes go wide. It's frozen. Not fear — just absolute refusal to process this situation. ${p}: "I'm standing STILL now."`,
      (p, a, pr) => `The ${a.name} hides inside ${p}'s bag. ${p} can't train an animal that is INSIDE a bag. ${host()}: "Maybe try a different approach?" ${p}: "YOU try it."`,
    ],
    cunning: [
      (p, a, pr) => `${p} gives a command. The ${a.name} pretends to obey, then does something completely different. ${p} doesn't realize for thirty seconds. ${host()}: "You've been played."`,
      (p, a, pr) => `The ${a.name} distracts ${p} with cuteness, then steals ${pr.posAdj} training treats. All of them. ${p}: "WHERE DID THEY GO—" The ${a.name} burps.`,
      (p, a, pr) => `${p} sets up the trick. The ${a.name} dismantles it and builds something else. ${p}: "That's NOT what we're doing." The ${a.name} disagrees.`,
      (p, a, pr) => `${p} demonstrates. The ${a.name} watches carefully. Then teaches ITSELF a different trick. An objectively cooler trick. ${p}: "You're the worst."`,
    ],
    aggressive: [
      (p, a, pr) => `${p} extends a hand. The ${a.name} snaps at it. ${p} recoils. "OKAY. No touching. Got it." The ${a.name} snarls in agreement.`,
      (p, a, pr) => `The ${a.name} charges the training equipment and destroys it. ${p}: "That was the OBSTACLE. You were supposed to GO AROUND IT."`,
      (p, a, pr) => `${p} tries authority. The ${a.name} responds with teeth. ${p} tries gentleness. The ${a.name} responds with MORE teeth. ${p}: "Do you have... any other settings?"`,
      (p, a, pr) => `Training attempt #4. The ${a.name} knocks ${p} down. Again. ${p} from the ground: "I think we need couples therapy."`,
    ],
    lazy: [
      (p, a, pr) => `${p} prods the ${a.name}. It's asleep. Still asleep. ${p} plays music. Asleep. ${p} yells. One eye opens. Closes. ${p}: "I've lost to unconsciousness."`,
      (p, a, pr) => `The ${a.name} starts the trick. Gets halfway through. Decides it's too much effort. Lies down mid-trick. ${p}: "You were SO CLOSE."`,
      (p, a, pr) => `${p} tries to motivate the ${a.name} with treats. It eats the treat without moving. ${p} tries more treats. Same result. ${p} is being extorted.`,
      (p, a, pr) => `The ${a.name} rolls over — ${p} thinks it's doing the trick — but no, it's just finding a comfier sleeping position. ${p}: "I hate this."`,
    ],
    playful: [
      (p, a, pr) => `The ${a.name} thinks the trick is a game of tag. Runs AWAY from ${p}. ${p} chases. The other players watch this circus unfold. ${host()}: "Entertainment gold."`,
      (p, a, pr) => `${p} gives a command. The ${a.name} does a somersault instead. Wrong trick, right enthusiasm. ${p}: "That's amazing but WRONG."`,
      (p, a, pr) => `The ${a.name} is having too much fun to focus. It bounces between stations, plays with other animals, steals a shoe. ${p}: "This isn't recess!"`,
      (p, a, pr) => `${p}: "Focus." The ${a.name} does a spin. "FOCUS." Another spin. "Please?" Three spins and a screech of joy. Focus is not available today.`,
    ],
    stubborn: [
      (p, a, pr) => `${p}: "Jump." The ${a.name}: *does not jump*. ${p}: "JUMP." *does not jump harder*. How can something not-jump HARDER? This animal found a way.`,
      (p, a, pr) => `The ${a.name} plants its feet. ${p} pushes. It doesn't budge. ${p} bribes. Nothing. ${p} threatens. It yawns. This animal has achieved enlightened defiance.`,
      (p, a, pr) => `${p} demonstrates the trick five times. The ${a.name} watches all five. Understands all five. Performs zero. ${p}: "You KNOW how. You just WON'T." Correct.`,
      (p, a, pr) => `The ${a.name} does the OPPOSITE of every command. Sit → stand. Come → go. Stay → leave. ${p}: "Is this a bit? Are you doing a BIT?"`,
    ],
    proud: [
      (p, a, pr) => `The ${a.name} looks at the trick. Looks at ${p}. The expression says "beneath me." It turns away. The trick remains undone. ${p}: "It's not BENEATH you, it's FOR you."`,
      (p, a, pr) => `${p} asks nicely. The ${a.name} doesn't acknowledge ${p}'s existence. ${p} asks again. A regal head-turn away. ${p}: "I'm being GHOSTED by a ${a.name.toLowerCase()}."`,
      (p, a, pr) => `The ${a.name} does the trick — but only the parts it considers elegant. The rest? Below its station. ${p}: "You can't just skip the hard parts!"`,
      (p, a, pr) => `${p}'s approach is too casual. The ${a.name} is OFFENDED. It refuses to work until properly addressed. ${p} doesn't know the proper protocol. Impasse.`,
    ],
    loyal: [
      (p, a, pr) => `The ${a.name} wants to please ${p}. It REALLY does. But it doesn't understand the command. It does something else — eagerly, loyally, WRONG.`,
      (p, a, pr) => `The ${a.name} follows ${p} instead of doing the trick. ${p} goes to the course. It follows. ${p} points at the course. It sits at ${pr.posAdj} feet. ${p}: "You're supposed to DO it, not WATCH me."`,
      (p, a, pr) => `Miscommunication. The ${a.name} does the trick from LAST round, not this one. It looks at ${p} hopefully. Wrong trick, but full heart. ${p}: "That's... close?"`,
      (p, a, pr) => `The ${a.name} keeps bringing ${p} sticks instead of performing. ${p}: "I appreciate the gifts but PLEASE do the trick." It brings another stick.`,
    ],
    clever: [
      (p, a, pr) => `The ${a.name} understands the trick. Does the math. Determines it's not worth the caloric expenditure. Sits down. ${p}: "I saw you CALCULATE that refusal."`,
      (p, a, pr) => `${p} gives the signal. The ${a.name} gives it back. The EXACT same signal. Mockingly. ${p}: "Are you making fun of me?" It is.`,
      (p, a, pr) => `The ${a.name} modifies the trick to be easier. ${p} doesn't notice until ${host()} points it out. "That ${a.name.toLowerCase()} cut two corners." ${p}: "...Clever girl."`,
      (p, a, pr) => `${p} tries to outsmart the ${a.name}. The ${a.name} outsmart-outsmarks ${p}. ${host()}: "You just got out-strategized by something with a brain the size of a walnut."`,
    ],
    gentle: [
      (p, a, pr) => `${p} raises ${pr.posAdj} voice. The ${a.name} shrinks. Not in fear — in hurt feelings. ${p}: "I didn't mean to yell." Too late. The ${a.name} won't make eye contact now.`,
      (p, a, pr) => `The ${a.name} tries the trick but stops halfway, overwhelmed. It nudges ${p}'s hand for comfort instead of finishing. ${p}: "We'll try again. No rush." There IS rush, but not for this one.`,
      (p, a, pr) => `Too much noise, too many people. The ${a.name} presses against ${p}'s leg and refuses to move. Not stubborn — just overstimulated. ${p}: "I know, buddy. I know."`,
      (p, a, pr) => `The ${a.name} does the trick wrong — then looks at ${p} with enormous sad eyes. ${p} can't even be frustrated. ${p}: "It's okay." It is not okay. But those EYES.`,
    ],
    sly: [
      (p, a, pr) => `${p} gives a command. The ${a.name} pretends it didn't hear. ${p} gives it louder. The ${a.name} pretends harder. ${p}: "I KNOW you heard me." It definitely heard.`,
      (p, a, pr) => `The ${a.name} starts the trick, then stops to groom itself. ${p} waits. It grooms more. ${p}: "This is a STALL TACTIC." Correct. A very good one.`,
      (p, a, pr) => `${p} demonstrates. The ${a.name} watches, yawns, and walks away. Not rudely — casually. Like it has somewhere better to be. ${p}: "WHERE are you GOING?"`,
      (p, a, pr) => `The ${a.name} does a DIFFERENT trick — one ${p} never taught. Perfectly. ${p}: "That's amazing but it's THE WRONG ONE." The ${a.name} knows. The ${a.name} doesn't care.`,
    ],
    mischievous: [
      (p, a, pr) => `The ${a.name} does the trick on the WRONG equipment. On purpose. Then looks at ${p} like "what? I did it." ${p}: "That's not YOUR course!" It is now.`,
      (p, a, pr) => `${p} gives a command. The ${a.name} sprays water everywhere. Where is the water coming from?! ${p}: "STOP THAT." It does not stop that. ${host()}: "I love this animal."`,
      (p, a, pr) => `The ${a.name} trips ${p} during the demonstration. ${p} falls. The ${a.name} chatters happily. The other teams laugh. ${p}: "This is SABOTAGE from my OWN partner."`,
      (p, a, pr) => `${p} sets up the trick carefully. The ${a.name} steals a key prop and hides it in another player's bag. Chaos ensues. ${p}: "You're a MENACE."`,
    ],
    spirited: [
      (p, a, pr) => `The ${a.name} has too much energy to focus. It runs laps. Literal laps. ${p} tries to intercept. Gets dragged. ${host()}: "That's a horse/bull problem."`,
      (p, a, pr) => `${p} gives a command. The ${a.name} rears up dramatically and does something else entirely. Impressive, but wrong. ${p}: "CHANNEL it, don't UNLEASH it!"`,
      (p, a, pr) => `The ${a.name} crashes through the obstacle course instead of navigating it. Boards fly. ${p}: "Those were ARRANGED." They are no longer arranged.`,
      (p, a, pr) => `Too much power, not enough precision. The ${a.name} overshoots every mark by a mile. ${p}: "LESS. Less energy. Please." The ${a.name} does not have a less setting.`,
    ],
    focused: [
      (p, a, pr) => `The ${a.name} is distracted by... nothing? It's staring at a spot on the ground. Intensely. ${p}: "What are you LOOKING at?" Nobody knows. The ${a.name} knows. It's not sharing.`,
      (p, a, pr) => `${p} gives the command. The ${a.name} has locked onto a bird in the distance and won't break focus. ${p} waves, shouts, offers treats. Nothing. The bird has won.`,
      (p, a, pr) => `The ${a.name} does half the trick perfectly, then stops. Analyzes. Decides the second half isn't optimal. Sits down. ${p}: "You can't just OPTIMIZE OUT half the trick."`,
      (p, a, pr) => `Wrong target. The ${a.name} performs the trick toward the judges instead of the audience. Technically correct, strategically wrong. ${p}: "Close enough? No? Okay."`,
    ],
    volatile: [
      (p, a, pr) => `The ${a.name}'s mood SNAPS. Mid-trick. One second cooperating, next second CHAOS. ${p} scrambles. ${host()}: "MOOD SWING!" ${p}: "I NOTICED, THANKS."`,
      (p, a, pr) => `${p} pushes too hard. The ${a.name} kicks the training post. It breaks. ${p}: "That was LOAD-BEARING." The ${a.name} does not care about structural integrity.`,
      (p, a, pr) => `A noise from the audience. The ${a.name} goes from calm to furious in 0.2 seconds. The trick is abandoned. ${p} spends the rest of the round just containing the animal.`,
      (p, a, pr) => `The ${a.name} starts the trick, gets frustrated, and takes it out on the equipment. ${p}: "That was SUPPOSED to be gentle!" Gentle is not in this animal's vocabulary.`,
    ],
    patient: [
      (p, a, pr) => `${p} gives the command. The ${a.name} begins moving. Slowly. So slowly. ${p} ages visibly waiting. Time runs out before the trick is half done. ${p}: "It wasn't WRONG. It was just GLACIAL."`,
      (p, a, pr) => `The ${a.name} considers the trick. Considers more. Considers further. ${p}: "PLEASE." It blinks. Continues considering. The round ends. Consideration ongoing.`,
      (p, a, pr) => `${p} tries urgency. Claps. Shouts. Points. The ${a.name} processes each stimulus individually, in order, at its own pace. ${p}: "I'm going to be here FOREVER."`,
      (p, a, pr) => `The ${a.name} starts the trick... in slow motion. ${p} tries to speed it up. The ${a.name} slows DOWN. Out of spite? Or just because. ${host()}: "That's an immovable force."`,
    ],
  },
  criticalFailure: [
    (p, a, pr) => `The ${a.name} breaks free and runs into the forest. ${p} chases. ${host()}: "Should we... help?" Chef: "No. This is hilarious." ${p} returns ten minutes later. Scratched. Muddy. Animal-less. The ${a.name} is already back at camp, eating Chef's lunch.`,
    (p, a, pr) => `The ${a.name} climbs onto the judge's table and refuses to come down. It eats Chef's sandwich. Chef: "THAT WAS MY SANDWICH!" ${host()}: "The ${a.name.toLowerCase()} has better taste than its trainer."`,
    (p, a, pr) => `Total meltdown. The ${a.name} panics and drags ${p} across the clearing by the leash. Three chairs broken. One table flipped. Chef's hat lost forever. ${host()}: "TEN out of ten for chaos."`,
    (p, a, pr) => `The ${a.name} does the trick — on the WRONG person. ${p} watches as ${pr.posAdj} animal performs perfectly for someone else. ${host()}: "That's actually... really good. For THEM." ${p}: "I'm going to cry."`,
    (p, a, pr) => `The ${a.name} and another animal start fighting. ${p} gets caught in the middle. Fur and feathers everywhere. ${host()}: "This is nature, folks. Beautiful, violent nature."`,
    (p, a, pr) => `The ${a.name} eats the entire bag of treats. ALL of them. Then looks at ${p} for more. ${p}: "Those were for the WHOLE CHALLENGE." The ${a.name} burps. No regrets.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — JUDGING
// ══════════════════════════════════════════════════════════════
export const JUDGING_TEXT = {
  performance: {
    standingOvation: [
      (p, a, pr) => `${p} and the ${a.name} are FLAWLESS. The trick lands perfectly. The ${a.name} poses. ${p} poses. The clearing erupts. ${host()} is on ${pronouns(host()).posAdj || 'his'} feet.`,
      (p, a, pr) => `Showstopper. The ${a.name} does things no animal should be able to do. ${p} commands with total confidence. The other teams look terrified.`,
      (p, a, pr) => `${p} and the ${a.name} perform in perfect sync — a routine that looks rehearsed for weeks, not hours. ${host()}: "That's the best thing I've ever seen on this show."`,
      (p, a, pr) => `The crowd goes WILD. Well, the other castmates go wild. The ${a.name} takes a bow. ${p} takes a bow. They bow TOGETHER. ${host()}: "I'm... actually moved."`,
    ],
    impressed: [
      (p, a, pr) => `Solid performance from ${p} and the ${a.name}. Not perfect — the dismount was shaky — but the chemistry carries it. ${host()} nods approvingly.`,
      (p, a, pr) => `${p} and the ${a.name} pull off the routine with minor wobbles. The ${a.name} improvises around ${p}'s mistakes, which is honestly more impressive.`,
      (p, a, pr) => `Clean work from team ${p}. The ${a.name} hits its marks, ${p} stays in control. Won't win any awards, but won't be going home because of it either.`,
      (p, a, pr) => `${p} recovers from a near-mishap with charm. The ${a.name} cooperates beautifully. ${host()}: "Good save. That could have been a disaster."`,
    ],
    meh: [
      (p, a, pr) => `${p} and the ${a.name} get through it. Barely. The ${a.name} does about half of what ${p} asks and freelances the rest. ${host()}: "That was... present."`,
      (p, a, pr) => `Middling performance. ${p} tries hard. The ${a.name} tries less hard. Together they produce something technically qualifying as a routine.`,
      (p, a, pr) => `Not bad, not good. The ${a.name} hits some marks, misses others. ${p}'s showmanship fills the gaps. ${host()}: "It's fine. It's... fine."`,
      (p, a, pr) => `${p} performs with conviction. The ${a.name} performs with apathy. The average is mediocrity. Chef shrugs. ${host()} makes a note.`,
    ],
    disaster: [
      (p, a, pr) => `${p} commands. The ${a.name} does something else entirely. The routine falls apart in real time. ${host()} winces. Chef looks away. The other teams smell blood.`,
      (p, a, pr) => `The ${a.name} stages a one-animal rebellion during the performance. ${p} tries to improvise. It's not going well. ${host()}: "This is... educational."`,
      (p, a, pr) => `${p}'s routine goes off the rails when the ${a.name} decides to take a nap mid-performance. ${p} tries to pretend it's part of the act. Nobody is fooled.`,
      (p, a, pr) => `Nothing works. The ${a.name} ignores every cue. ${p} tap-dances to fill time. It doesn't help. ${host()}: "Well... you tried. That counts for... something?"`,
    ],
    catastrophe: [
      (p, a, pr) => `The ${a.name} attacks the props, escapes the ring, steals Chef's hat, and returns wearing it. ${p} stands in the wreckage. ${host()}: "THAT was entertainment." ${p}: "My dignity is dead."`,
      (p, a, pr) => `It's a trainwreck. Beautiful, horrible, unforgettable. The ${a.name} runs amok. ${p} gives up and just narrates the chaos. "And there goes my animal. Into the woods. Goodbye."`,
      (p, a, pr) => `${p}'s performance is interrupted by the ${a.name} doing something unspeakable to ${host()}'s chair. ${host()}: "MY CHAIR!" ${p}: "I'm so sorry." The ${a.name} is not sorry.`,
      (p, a, pr) => `Total catastrophe. The ${a.name} flings things. ${p} dodges things. The audience scrambles. ${host()} hides behind Chef. Chef hides behind nobody. "I SHOULD HAVE STAYED IN THE KITCHEN!"`,
    ],
  },
  chrisComment: {
    standingOvation: [
      (p, a) => `${host()}: "9! Maybe even... NINE. Yeah, I'm going NINE. That ${a.name.toLowerCase()} is a STAR."`,
      (p, a) => `${host()}: "I'm giving this a 10. Don't tell the others. Actually, DO tell them. I want them scared."`,
      (p, a) => `${host()}: "NINE. That was absolutely incredible. I've never seen an animal do that. I've never seen a HUMAN do that."`,
      (p, a) => `${host()}: "Perfect 10. Yes, I said it. No, I won't take it back. FIGHT ME about it."`,
    ],
    impressed: [
      (p, a) => `${host()}: "Solid 7. Maybe 8 if I'm feeling generous. And I AM feeling generous, so... 8! Wait, no. 7."`,
      (p, a) => `${host()}: "That was GOOD. Not great. But good. I'll say... 8. The ${a.name.toLowerCase()} earned it."`,
      (p, a) => `${host()}: "7. Clean performance. I've seen better, but I've definitely seen worse. Looking at you, Chef."`,
      (p, a) => `${host()}: "I'll give you an 8. The ${a.name.toLowerCase()} carried you, but I won't tell anyone. ...I'll tell everyone."`,
    ],
    meh: [
      (p, a) => `${host()}: "5. Right down the middle. Like this performance. Which was... in the middle."`,
      (p, a) => `${host()}: "I'm gonna say... 6. It existed. It happened. I saw it. I'll forget it by dinner."`,
      (p, a) => `${host()}: "5. You tried. The ${a.name.toLowerCase()} tried less. Average it out: a 5. Math checks out."`,
      (p, a) => `${host()}: "Ehhh... 6? I've seen worse. Today. From other teams. But also this was not great."`,
    ],
    disaster: [
      (p, a) => `${host()}: "3. And that's being KIND. The ${a.name.toLowerCase()} looked bored. I was bored. Chef fell asleep."`,
      (p, a) => `${host()}: "A generous 4. The effort was there. The results were... not there. At all."`,
      (p, a) => `${host()}: "I'll say 3. Because I can't legally go lower. Can I? ...My lawyers are saying no."`,
      (p, a) => `${host()}: "4. And I'm being nice because I know the ${a.name.toLowerCase()} is watching. It looks angry."`,
    ],
    catastrophe: [
      (p, a) => `${host()}: "1. ONE. That was the worst thing I've ever seen. And I've seen EVERY season of this show."`,
      (p, a) => `${host()}: "2. And that's only because the ${a.name.toLowerCase()} stealing Chef's hat made me laugh. That's worth one bonus point."`,
      (p, a) => `${host()}: "1. Zero isn't a number I'm allowed to give. But I WANT to. So badly."`,
      (p, a) => `${host()}: "...2. I need to lie down. That physically hurt me to watch."`,
    ],
  },
  chefComment: {
    standingOvation: [
      (p, a) => `Chef: "Mon dieu. That was... beautiful. I give it a 9. Maybe even a 10. The ${a.name.toLowerCase()} has more talent than EVERY castmate combined."`,
      (p, a) => `Chef: "MAGNIFICO! 10! That ${a.name.toLowerCase()} is the best performer I've ever seen. Better than the humans. MUCH better than the humans."`,
      (p, a) => `Chef: "I... I have something in my eye. 9. That was genuinely moving. DON'T TELL ANYONE I SAID THAT."`,
      (p, a) => `Chef: "10. The ${a.name.toLowerCase()} deserves a MICHELIN STAR. Can animals get Michelin stars? I'm MAKING it happen."`,
    ],
    impressed: [
      (p, a) => `Chef: "7. Good technique. The ${a.name.toLowerCase()} has promise. You... less promise. But together? 7."`,
      (p, a) => `Chef: "I give 8. The ${a.name.toLowerCase()} remind me of my old cat, Monsieur Whiskers. He too was talented. Unlike his owner."`,
      (p, a) => `Chef: "Hmm. 7. Not bad. Not amazing. Like my Tuesday special. Reliable. Nobody complains. Nobody cheers."`,
      (p, a) => `Chef: "8! The ${a.name.toLowerCase()} has charisma. You riding the coattails, but... 8."`,
    ],
    meh: [
      (p, a) => `Chef: "5. That is what I give to lukewarm soup. It exists. It is soup. That is all."`,
      (p, a) => `Chef: "6. The ${a.name.toLowerCase()} tried harder than you. That's... not a compliment to either of you."`,
      (p, a) => `Chef: "5. I've seen better from PIGEONS. And I do NOT like pigeons. But they perform BETTER."`,
      (p, a) => `Chef: "Ehhhh... 6. My grandmother could do better and she is NINETY-THREE and does not have an animal."`,
    ],
    disaster: [
      (p, a) => `Chef: "3. That was PAINFUL. My eyes hurt. My SOUL hurts. The ${a.name.toLowerCase()} should fire you as a trainer."`,
      (p, a) => `Chef: "4. And I'm being GENEROUS because the ${a.name.toLowerCase()} is cute. YOU are not cute enough to save this."`,
      (p, a) => `Chef: "3. I have tasted expired milk with more charm than that performance. At least the milk was SURPRISING."`,
      (p, a) => `Chef: "4. That was worse than my ex-wife's cooking. And she once served me a shoe. A SHOE."`,
    ],
    catastrophe: [
      (p, a) => `Chef: "1. UN. UNO. ONE. I want to give ZERO. I want to give NEGATIVE numbers. That was CRIMINAL."`,
      (p, a) => `Chef: "2. Only because the ${a.name.toLowerCase()} destroyed my nemesis's chair. VENGEANCE tastes like a 2."`,
      (p, a) => `Chef: "1. I am OFFENDED. That was an INSULT to animals, to training, to PERFORMANCE, and to ME PERSONALLY."`,
      (p, a) => `Chef: "...1. I need to go lie down in the kitchen. The kitchen understands me. Unlike THIS PERFORMANCE."`,
    ],
  },
};

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — FOREST RACE
// ══════════════════════════════════════════════════════════════
const FOREST_LENGTH = 14;

export const FOREST_TEXT = {
  movement: {
    fast: [
      (p, a, pr) => `${p} and the ${a.name} tear through the undergrowth. Branches snap, leaves fly. They're MOVING.`,
      (p, a, pr) => `The ${a.name} finds a rhythm and ${p} matches it. Stride for stride. They devour ground like it's personal.`,
      (p, a, pr) => `${p} hits ${pr.posAdj} stride. The ${a.name} keeps pace effortlessly. Trees blur past. They're making serious time.`,
      (p, a, pr) => `Explosive burst from ${p} and the ${a.name}. They blast through a clearing and gain serious ground. Nobody's catching them.`,
    ],
    medium: [
      (p, a, pr) => `${p} and the ${a.name} maintain a steady pace. Not blazing, not crawling. Smart racing.`,
      (p, a, pr) => `Consistent movement from team ${p}. The ${a.name} navigates while ${p} pushes forward. Good teamwork.`,
      (p, a, pr) => `${p} jogs through the forest with the ${a.name} trotting alongside. Measured pace. Saving energy for when it counts.`,
      (p, a, pr) => `The ${a.name} leads ${p} along a decent trail. Not the fastest route, but no wrong turns. Progress is progress.`,
    ],
    slow: [
      (p, a, pr) => `${p} and the ${a.name} struggle through dense brush. Every step is a battle. The forest is winning.`,
      (p, a, pr) => `The ${a.name} is not built for speed. Neither is ${p} today. They trudge forward with grim determination and minimal velocity.`,
      (p, a, pr) => `${p} stumbles. The ${a.name} waits. ${p} gets up. They move again. Slowly. Very, very slowly.`,
      (p, a, pr) => `Thick mud. The ${a.name} sinks. ${p} pulls. They extract themselves. Resume at approximately negative speed. ${host()}: "That's going... backwards? No. Forward. Barely."`,
    ],
    enterDeepWoods: [
      (p, a, pr) => `${p} and the ${a.name} push past the tree line into DEEP FOREST. The canopy blocks the sun. It's darker here. Harder. ${p}: "This just got real."`,
      (p, a, pr) => `The trail narrows as ${p} enters the dense section. The ${a.name} growls at the shadows. ${host()} over loudspeaker: "Welcome to the HARD part!"`,
      (p, a, pr) => `Trees close in around ${p}. The ${a.name} presses closer. The forest floor is thick with roots and mud. Everything just got harder.`,
      (p, a, pr) => `${p} crosses into uncharted territory. The easy trails are gone — it's pure wilderness from here. The ${a.name} sniffs the air, uncertain.`,
    ],
    enterHomeStretch: [
      (p, a, pr) => `${p} can SEE the meadow through the trees! Three segments left! The ${a.name} senses it too — SPRINT MODE ACTIVATED.`,
      (p, a, pr) => `The trees thin. Sunlight ahead. ${p}: "I can see the finish!" The ${a.name} BOLTS. ${p} tries to keep up. ${host()}: "HOME STRETCH!"`,
      (p, a, pr) => `Light breaks through the canopy. The meadow is CLOSE. ${p}'s legs burn but ${pr.sub} doesn't care. The ${a.name} charges forward. ALMOST THERE.`,
      (p, a, pr) => `Birdsong. Open sky ahead. ${p} hears the crowd at the meadow. Two-three segments left. The ${a.name} smells freedom. They're RUNNING.`,
    ],
    nearFinish: [
      (p, a, pr) => `${p} is ONE segment from the finish! The ${a.name} is running flat-out! The crowd at the meadow is SCREAMING!`,
      (p, a, pr) => `FINAL PUSH! ${p} can see the finish banner! The ${a.name} is giving everything! ${host()}: "${p.toUpperCase()} IS ABOUT TO WIN THIS!"`,
      (p, a, pr) => `The meadow opens up right in front of ${p}. One last burst! The ${a.name} leaps forward! ${host()}: "DON'T STOP NOW!"`,
      (p, a, pr) => `${p} crashes through the last line of brush — the finish is RIGHT THERE. The ${a.name} is already ahead. IMMUNITY IS WITHIN REACH.`,
    ],
    falling: [
      (p, a, pr) => `${p} is falling behind. The leaders are pulling away. The ${a.name} looks worried. ${p}: "I know, I KNOW."`,
      (p, a, pr) => `The gap is growing. ${p} can't even see the leaders anymore. The ${a.name} tugs at ${pr.posAdj} sleeve. Keep moving. Don't give up.`,
      (p, a, pr) => `${p} is in last place and ${pr.sub} knows it. The ${a.name} nuzzles ${pr.posAdj} hand. Encouragement. ${p}: "At least ONE of us isn't panicking."`,
      (p, a, pr) => `Dead last. ${p} pushes through exhaustion. The ${a.name} refuses to leave ${pr.posAdj} side. ${host()}: "That's loyalty right there. Not speed. But loyalty."`,
    ],
    leading: [
      (p, a, pr) => `${p} is OUT FRONT! Nobody can catch ${pr.obj} at this pace! The ${a.name} leads the charge through the forest like ${pr.sub} was born here!`,
      (p, a, pr) => `Way ahead of the pack. ${p} and the ${a.name} own this trail. ${host()}: "The lead is MASSIVE. Everyone else is racing for second."`,
      (p, a, pr) => `${p} is setting a pace nobody can match. The ${a.name} is in ${pr.posAdj} element. Behind them? Distant footsteps and distant hopes.`,
      (p, a, pr) => `First place by a MILE. ${p} doesn't even look back. The ${a.name} doesn't need to. They can't hear anyone behind them. That's how far ahead they are.`,
    ],
    chasing: [
      (p, a, pr) => `${p} spots the leader's trail dust and SURGES. The ${a.name} matches the intensity. The gap is closing!`,
      (p, a, pr) => `${p} is gaining on the leader! Every segment matters! The ${a.name} digs deep and finds another gear! ${host()}: "We've got a RACE!"`,
      (p, a, pr) => `Second place and HUNGRY. ${p} can see the leader through the trees. The ${a.name} senses the rival. Time to PUSH.`,
      (p, a, pr) => `The lead is shrinking! ${p} cuts a corner and closes ground! The ${a.name} is running like its life depends on it!`,
    ],
  },
  navigation: {
    success: [
      (p, a, pr) => `Fork in the trail. The ${a.name} sniffs left, sniffs right, and heads left decisively. Five minutes later, a shortcut opens up. ${p}: "Trust the nose."`,
      (p, a, pr) => `${p} spots trail markers that others missed. ${pr.Sub} takes a narrow path through the trees — it cuts two segments off the route. Smart eyes.`,
      (p, a, pr) => `The ${a.name}'s instincts kick in. It veers off the main trail into what looks like nothing — but opens into a clear ridge path. ${p}: "How did you KNOW?"`,
      (p, a, pr) => `${p} reads the terrain like a map. Downhill means water means clearing means SPEED. ${pr.Sub} picks the right path without hesitation.`,
    ],
    failure: [
      (p, a, pr) => `${p} goes left. Should have gone right. The ${a.name} TRIED to tell ${pr.obj}. ${p}: "You could have been more clear!" It was very clear. ${p} didn't listen.`,
      (p, a, pr) => `Dead end. ${p} and the ${a.name} backtrack, losing precious time. The forest all looks the same. ${p}: "I swear we've passed that tree before."`,
      (p, a, pr) => `The ${a.name} leads ${p} into a ravine. Getting out takes longer than getting in. ${p}: "Navigation was YOUR job." The ${a.name} shrugs. Animals can't shrug. And yet.`,
      (p, a, pr) => `Wrong turn. Then another wrong turn. ${p} is now further from the exit than ten minutes ago. ${host()}'s drone footage catches ${pr.obj} walking in a circle. Twice.`,
      (p, a, pr) => `${p} follows what ${pr.sub} thinks is a game trail. It's a deer path to nowhere. The ${a.name} sits down in protest. ${p}: "Fine. YOUR way." The ${a.name} goes the exact opposite direction. Smart.`,
    ],
  },
  obstacle: {
    success: [
      (p, a, pr) => `Fallen tree blocks the path. ${p} vaults it. The ${a.name} goes under it. Both clear. No time lost. ${host()}: "Teamwork!"`,
      (p, a, pr) => `River crossing. ${p} finds stepping stones. The ${a.name} swims. They reconvene on the other side, barely slowed down.`,
      (p, a, pr) => `Steep embankment. ${p} climbs while the ${a.name} finds an alternate route around. They meet at the top. Smart division of labor.`,
      (p, a, pr) => `Mudslide blocks the trail. ${p} and the ${a.name} power through, emerging covered in mud but on the right side. ${p}: "That was GROSS but effective."`,
    ],
    failure: [
      (p, a, pr) => `River crossing goes wrong. ${p} slips on a rock and gets soaked. The ${a.name} watches from the dry bank, judging. ${p}: "A little HELP?!" It offers no help.`,
      (p, a, pr) => `Cliff face. ${p} tries to climb. Gets halfway up. Looks down. Gets back down. The ${a.name} was already going around. ${p} follows, having wasted a full minute.`,
      (p, a, pr) => `Fallen tree. ${p} tries to go over. Gets stuck. The ${a.name} goes under. ${p}: "I'm STUCK." The ${a.name} comes back. Stares. Leaves. ${p} eventually gets unstuck. Alone.`,
      (p, a, pr) => `Mudslide. ${p} sinks to ${pr.posAdj} knees. The ${a.name} sinks to... well, its entire body. ${p} pulls the ${a.name} out. Pulls ${pr.ref} out. Lost serious time.`,
    ],
  },
  trap: {
    success: [
      (p, a, pr) => `Net trap! The ${a.name} spots it first and freezes. ${p} follows its gaze — tripwire, three inches off the ground. They step over it carefully. Crisis averted.`,
      (p, a, pr) => `Pit trap covered by leaves. ${p}'s instincts scream "wrong" and ${pr.sub} stops just in time. The ${a.name} sniffs the edge. Yep. Would've been bad.`,
      (p, a, pr) => `${p} notices the trail looks TOO easy. ${pr.Sub} tests the ground ahead with a stick. Snare trigger. "Nice try, ${host()}." ${host()} via loudspeaker: "It was worth a shot."`,
      (p, a, pr) => `The ${a.name} refuses to go forward. ${p} trusts it. Goes around. Finds the buried net launcher. ${p}: "You saved us." Treat awarded. Treat deserved.`,
    ],
    failure: [
      (p, a, pr) => `NET! ${p} and the ${a.name} are caught mid-stride. Tangled. Helpless. It takes two full minutes to untangle. ${host()}: "Those traps are EXPENSIVE, by the way."`,
      (p, a, pr) => `${p} steps on a trigger plate. WHOOSH. Launched into a bush by a spring trap. The ${a.name} watches, untrapped, unimpressed. ${host()}: "GOTCHA!"`,
      (p, a, pr) => `Pit trap. ${p} falls in. It's only three feet deep but the indignity is ENORMOUS. The ${a.name} peers down from above. ${p}: "Don't just STARE."`,
      (p, a, pr) => `Snare grabs ${p}'s ankle. ${pr.Sub} hangs upside down from a tree for forty-five seconds while the ${a.name} presumably contemplates helping. It does not help. ${p}: "SOME partner."`,
    ],
  },
  animalMoment: {
    hamster: [
      (p, a, pr) => `The Hamster finds a tiny hole in a log and zips through — a shortcut ${p} could NEVER fit through. ${p} meets it on the other side. ${p}: "Did you just... teleport?"`,
      (p, a, pr) => `The Hamster stuffs its cheeks with berries mid-race. ${p}: "This is NOT the time for snacking." The Hamster disagrees. The Hamster is always snacking.`,
    ],
    parrot: [
      (p, a, pr) => `The Parrot flies ahead and comes back screeching directions. Left! Left! LEFT! ${p} goes left. It works. ${p}: "You're literally a GPS."`,
      (p, a, pr) => `The Parrot mimics ${host()}'s voice: "The exit is THIS way!" ${p} follows. It's the wrong way. ${p}: "Did you just lie? In someone ELSE'S voice?!"`,
    ],
    raccoon: [
      (p, a, pr) => `The Raccoon picks a lock on a gate that was blocking a shortcut. ${p}: "Where did you learn that?!" The Raccoon's past is a mystery. A criminal mystery.`,
      (p, a, pr) => `The Raccoon steals another player's trail markers and rearranges them. Chaos for everyone else. ${p}: "I didn't ask you to do that." ${p} doesn't ask it to stop, either.`,
    ],
    chameleon: [
      (p, a, pr) => `The Chameleon vanishes against a tree trunk. ${p}: "Where did you— wait." It reappears on ${pr.posAdj} shoulder. It was there the whole time. ${p}: "Please stop doing that."`,
      (p, a, pr) => `The Chameleon goes perfectly still on a rock, turning invisible to a passing predator. ${p} takes notes. "I need to learn that."`,
    ],
    monkey: [
      (p, a, pr) => `The Monkey swings through the canopy and drops a vine down for ${p} to climb. Teamwork! ${p} scales the ridge in seconds. ${p}: "I feel like Tarzan!"`,
      (p, a, pr) => `The Monkey finds berries, shares them with ${p}, then pelts a rival team with the remaining ones. ${p}: "I appreciate the help and the sabotage equally."`,
    ],
    goat: [
      (p, a, pr) => `The Goat eats a bush that was blocking the trail. Just... eats it. The entire bush. ${p}: "You just ATE the obstacle." The Goat chews. Problem solved.`,
      (p, a, pr) => `Mountain terrain? The Goat doesn't even slow down. It drags ${p} up the incline like a furry four-legged ATV. ${p}: "LESS SPEED MORE CONTROL." The Goat does not do control.`,
    ],
    wolf: [
      (p, a, pr) => `The Wolf howls. In the distance, something howls back. The Wolf changes course. ${p} follows. The new route is clear. ${p}: "Did you just... call in directions?"`,
      (p, a, pr) => `The Wolf guards ${p}'s back when another team gets too close. Teeth bared. Message received. Nobody approaches. ${p}: "That's my bodyguard."`,
    ],
    eagle: [
      (p, a, pr) => `The Eagle soars above the canopy and circles back. ${p} watches its flight path — it's marking the best route from above. ${p}: "Aerial reconnaissance. I love it."`,
      (p, a, pr) => `The Eagle spots the exit from high altitude and SCREAMS, diving back toward ${p} excitedly. ${p}: "I'll take that as 'this way.'" It was definitely 'this way.'`,
    ],
    alligator: [
      (p, a, pr) => `River crossing. Every other team has to swim or find stones. ${p} rides the Alligator across. ${host()}: "IS THAT ALLOWED?!" Nobody said it wasn't!`,
      (p, a, pr) => `The Alligator takes point through swampy terrain. Other animals won't go near the water. This one OWNS the water. ${p} stays dry. Others don't.`,
    ],
    bear: [
      (p, a, pr) => `The Bear smells honey. Detour. ${p} tries to stop it. Cannot stop a bear that wants honey. They lose two minutes but the Bear is very, very happy now.`,
      (p, a, pr) => `Fallen log blocking the trail. The Bear pushes it aside with one paw. ${p}: "That log was HUGE." The Bear is unimpressed. It was a small log, by bear standards.`,
    ],
    shark: [
      (p, a, pr) => `The Shark is in a water-filled cart. ${p} pushes the cart. Through the forest. It's ridiculous. But the Shark keeps biting at obstacles, clearing brush. Somehow it works.`,
      (p, a, pr) => `They reach a river. The Shark is ECSTATIC. ${p} holds onto a fin and they blast downstream, covering three segments in one move. ${host()}: "THAT should be illegal!"`,
    ],
    moose: [
      (p, a, pr) => `${p} RIDES the Moose. Just straight up rides it through the forest. Branches snap. Small trees bend. ${host()}: "I didn't authorize that but I'm KEEPING it."`,
      (p, a, pr) => `The Moose gets angry at a tree in its path. Charges it. The tree loses. Path cleared. ${p}: "Remind me never to make you mad."`,
    ],
    rabbit: [
      (p, a, pr) => `The Rabbit darts through a thicket too dense for anyone else. ${p} follows the rustling. Thirty seconds later they're two segments ahead. ${p}: "You're a NAVIGATION genius."`,
      (p, a, pr) => `The Rabbit thumps its foot twice. ${p} stops. A trap — right where ${p} would have stepped. ${p}: "You just saved my race." The Rabbit wiggles its nose, satisfied.`,
    ],
    fox: [
      (p, a, pr) => `The Fox sniffs the air, changes direction, and leads ${p} through a hidden gap in the brush. ${p}: "You can literally SMELL the shortcut?" It can. It's infuriating.`,
      (p, a, pr) => `The Fox doubles back and runs through another team's trail, creating a false scent trail. ${p} watches the other team follow it into a dead end. ${p}: "Diabolical. I love it."`,
    ],
    otter: [
      (p, a, pr) => `River crossing. The Otter dives in, finds the shallowest ford, and squeaks from the other side. ${p} crosses in ten seconds while others search for a bridge. ${p}: "BUILT for this."`,
      (p, a, pr) => `The Otter slides down a muddy embankment on its belly, clearing the path. ${p} slides after it. Both arrive at the bottom covered in mud. Both grinning. ${host()}: "Graceful."`,
    ],
    horse: [
      (p, a, pr) => `The Horse bolts. ${p} grabs the mane and HANGS ON. Three segments covered in forty seconds. ${p}: "I DIDN'T SAY GO." But they went. And it was FAST.`,
      (p, a, pr) => `The Horse kicks a fallen log off the trail. ${p}: "Thank you." It snorts and charges ahead. ${p} sprints to keep up. The Horse is not waiting. The Horse waits for no one.`,
    ],
    hawk: [
      (p, a, pr) => `The Hawk launches from ${p}'s arm and circles high above the canopy. ${p} watches its flight pattern — banking left, left, right. ${p} follows. The path is clear. ${p}: "Aerial intel."`,
      (p, a, pr) => `The Hawk dives and snatches a trail marker from another player's hand. Drops it at ${p}'s feet. ${p}: "Did you just STEAL their directions?" It did. No remorse. ${host()}: "BIRD!"`,
    ],
    bull: [
      (p, a, pr) => `The Bull lowers its head and charges through a wall of brush. ${p} walks through the hole. ${p}: "Thank you for the door." The Bull is already making another one.`,
      (p, a, pr) => `Dense vegetation. No path. The Bull doesn't care. CRASH. SNAP. CRUNCH. A path appears. ${p}: "Bulldozer isn't just a word. It's a LIFESTYLE."`,
    ],
    python: [
      (p, a, pr) => `The Python slithers up a tree and hangs down, forming a living rope. ${p} climbs it. The Python doesn't even flinch. ${p}: "You're... very strong for a snake."`,
      (p, a, pr) => `The Python coils around a branch and goes absolutely still. ${p} waits. Five seconds later, a rival team walks right past without noticing them. ${p}: "Stealth mode. NICE."`,
    ],
  },
  playerInteraction: {
    help: [
      (p1, p2, pr1, pr2) => `${p1} and ${p2} reach the same obstacle. ${p1} helps ${p2} over. ${p2}: "Thanks." ${p1}: "Don't thank me yet — I'm still going to beat you."`,
      (p1, p2, pr1, pr2) => `${p2} is stuck. ${p1} backtracks to help. They lose time but gain respect. ${p2}: "I owe you one." ${p1}: "I know. I'm keeping score."`,
      (p1, p2, pr1, pr2) => `${p1} shares ${pr1.posAdj} water with ${p2}. Both animals drink too. Brief truce in the race. ${p1}: "Good luck out there." ${p2}: "Same."`,
      (p1, p2, pr1, pr2) => `${p1} spots ${p2} about to walk into a trap and shouts a warning. ${p2} stops just in time. Heroic. ${p1}: "Now we're even."`,
    ],
    race: [
      (p1, p2, pr1, pr2) => `${p1} and ${p2} spot each other through the trees. Eyes lock. Both SPRINT. The animals struggle to keep up with their humans. ${host()}: "NOW it's a race!"`,
      (p1, p2, pr1, pr2) => `Side by side! ${p1} and ${p2} run neck and neck through a clearing. Their animals are in a parallel footrace. The forest shakes with the effort.`,
      (p1, p2, pr1, pr2) => `${p1} sees ${p2} ahead and finds another gear. ${p2} hears the footsteps and finds ANOTHER gear. They push each other past limits neither knew they had.`,
      (p1, p2, pr1, pr2) => `The animals start racing each other before the humans do. Then the humans join in. It's a four-way sprint through dense forest. Branches fly.`,
    ],
    sabotage: [
      (p1, p2, pr1, pr2) => `${p1} "accidentally" knocks a branch into ${p2}'s path. ${p2} trips. ${p1}: "Oops. Didn't see you there." ${pr1.Sub} very much saw.`,
      (p1, p2, pr1, pr2) => `${p1} tells ${p2} the shortcut is left. It's right. ${p2} figures it out two minutes later. ${p1} is long gone. ${p2}: "I am going to DESTROY ${pr1.obj} at tribal."`,
      (p1, p2, pr1, pr2) => `${p1} swipes ${p2}'s trail markers when ${pr2.sub} isn't looking. ${p2} wanders in circles for a full minute. ${p1}: "It's a race. Not a friendship camp."`,
      (p1, p2, pr1, pr2) => `${p1}'s animal distracts ${p2}'s animal while ${p1} runs ahead. ${p2}: "Hey! That's— okay that's actually clever."`,
    ],
  },
};

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — MOLE SABOTAGE
// ══════════════════════════════════════════════════════════════
export const MOLE_TEXT = {
  training: [
    (mole, target, a, pr) => `${mole} sneaks over to ${target}'s station and agitates ${pr.posAdj} ${a.name} with a loud noise. The ${a.name} panics. Training derailed.`,
    (mole, target, a, pr) => `${mole} swaps ${target}'s good treats for stale ones. The ${a.name} spits them out in disgust. ${target}: "These are the GOOD treats!" They are not.`,
    (mole, target, a, pr) => `${mole} "accidentally" opens ${target}'s ${a.name}'s cage. It bolts. ${target} chases it for three minutes. ${mole} watches innocently. Too innocently.`,
    (mole, target, a, pr) => `While ${target} isn't looking, ${mole} teaches the ${a.name} the WRONG trick. ${target} doesn't realize until the performance. ${mole} suppresses a grin.`,
  ],
  forest: {
    gps: [
      (mole) => `The mole checks ${pronouns(mole).posAdj} hidden GPS device. Arrow pointing northwest. While everyone else navigates by instinct, ${mole} navigates by satellite. Cheating has never been this efficient.`,
      (mole) => `${mole} glances at the GPS tracker taped inside ${pronouns(mole).posAdj} sleeve. Three segments ahead, the exit glows on screen. ${mole} adjusts course. Nobody notices.`,
      (mole) => `The GPS beeps. ${mole} covers it quickly — nobody heard. But now ${pronouns(mole).sub} knows exactly where to go. The mole advantage is MASSIVE.`,
      (mole) => `${mole} pretends to sniff the air for directions. Actually reading a GPS hidden in ${pronouns(mole).posAdj} pocket. "I think... this way." It IS this way. Because technology.`,
    ],
    trap: [
      (mole, target) => `${mole} rigs a vine snare on the trail behind ${pronouns(mole).obj}. When ${target} comes through — SNAP. Caught. ${target}: "WHO set this?!" The forest doesn't answer. ${mole} is long gone.`,
      (mole, target) => `${mole} loosens a log bridge just enough. ${target} steps on it — CRACK. Into the creek below. ${mole} watches from the treeline. "Oh no. How terrible."`,
      (mole, target) => `${mole} marks a false shortcut with convincing trail markers. ${target} follows them straight into a dead end. ${mole} takes the REAL shortcut.`,
      (mole, target) => `${mole} collapses a bush across the trail, forcing ${target} to go the long way around. ${mole}: "Must have been the wind." There is no wind.`,
    ],
    fakeMarker: [
      (mole, target) => `${mole} carves a fake direction arrow into a tree. ${target} follows it and loses two segments. ${mole}: "What? I didn't see any arrow." Because ${pronouns(mole).sub} MADE the arrow.`,
      (mole, target) => `${mole} moves a legitimate trail marker to point the wrong way. ${target} trusts it. Shouldn't have. Three minutes wasted. ${mole} suppresses a smile.`,
      (mole, target) => `${mole} plants ${target}'s bandana near a wrong turn, making it look like ${target} already went that way and doubled back. ${target} follows the "trail." Into nowhere.`,
      (mole, target) => `${mole} whistles from the wrong direction. ${target} follows the sound, thinking it's a trail marker. It's not. ${mole} is already three segments ahead.`,
    ],
  },
};

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — SOCIAL EVENTS
// ══════════════════════════════════════════════════════════════
export const SOCIAL_TEXT = {
  animalBond: [
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} and ${p2}'s ${a2.name} nuzzle each other between rounds. Their owners exchange a look. ${p1}: "I think our animals are... friends?" ${p2}: "Apparently better friends than us."`,
    (p1, p2, a1, a2) => `The ${a1.name} and ${a2.name} play together during the break. ${p1} and ${p2} watch, then start chatting. The animals brought them together. ${p2}: "Your ${a1.name.toLowerCase()} is pretty cool."`,
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} shares its treats with ${p2}'s ${a2.name}. ${p1}: "I didn't teach it that." ${p2}: "It's got better manners than most people here."`,
    (p1, p2, a1, a2) => `The ${a1.name} grooms the ${a2.name}. ${p1} and ${p2} sit together watching. Something about seeing their animals get along makes the humans trust each other more.`,
  ],
  animalRivalry: [
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} HISSES at ${p2}'s ${a2.name}. The ${a2.name} growls back. ${p1}: "Easy..." ${p2}: "Control YOUR animal." ${p1}: "Control YOURS." Tension rises.`,
    (p1, p2, a1, a2) => `The ${a1.name} steals the ${a2.name}'s food. The ${a2.name} retaliates by knocking over the ${a1.name}'s water. Animal cold war. ${p1} and ${p2} glare at each other.`,
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} and ${p2}'s ${a2.name} have a standoff. Neither blinks. ${p1}: "This is getting weird." ${p2}: "YOUR animal started it." ${p1}: "Did NOT."`,
    (p1, p2, a1, a2) => `The ${a1.name} bumps the ${a2.name} aggressively. The ${a2.name} bumps back harder. ${p1} and ${p2} have to physically separate them. ${host()}: "The animals are more dramatic than the CAST."`,
  ],
  showmance: [
    (p1, p2, a1, a2) => `${p1} and ${p2} train side by side. Their hands brush reaching for the same treat bag. Both freeze. ${p1}: "You go." ${p2}: "No, you." The animals exchange a look that says "humans."`,
    (p1, p2, a1, a2) => `${p2}'s ${a2.name} escapes and runs to ${p1}. ${p2} comes to collect it. ${p1} and ${p2} end up standing very close. "Your ${a2.name.toLowerCase()} has good taste," ${p1} says. ${p2} blushes.`,
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} keeps walking over to ${p2}. ${p1} follows to retrieve it. This happens four times. ${p1}: "I swear it's the ANIMAL, not me." ${host()}: "Sure it is."`,
    (p1, p2, a1, a2) => `${p1} helps ${p2} bandage a scratch from ${pronouns(p2).posAdj} ${a2.name}. They sit close. Too close. ${host()}: "This is a CHALLENGE, not a DATE." They don't hear ${host()}.`,
  ],
  respect: [
    (p1, p2, a1, a2) => `${p2} watches ${p1} handle the ${a1.name} with real skill. ${p2}: "You're actually really good at this." ${p1}: "Thanks. Your ${a2.name.toLowerCase()} is impressive too." Mutual nod.`,
    (p1, p2, a1, a2) => `${p1} and ${p2} compare training notes. Genuinely helpful advice exchanged. No tricks, no sabotage. Just two competitors respecting each other's work.`,
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} pulls off something incredible. ${p2} claps. Actually claps. ${p1} tips an imaginary hat. Sportsmanship lives.`,
    (p1, p2, a1, a2) => `After the round, ${p2} approaches ${p1}: "That was brilliant. The way you handled that obstacle? I'm taking notes." ${p1}: "Steal my techniques. I'll still beat you."`,
  ],
  paranoia: [
    (p1, p2, a1, a2) => `${p1} sees ${p2} whispering to ${pronouns(p2).posAdj} ${a2.name}. ${p1}: "What are you telling it?!" ${p2}: "It's a ${a2.name.toLowerCase()}. I'm telling it to SIT." ${p1} doesn't believe that.`,
    (p1, p2, a1, a2) => `${p1} catches ${p2} studying ${pronouns(p1).posAdj} training technique. ${p1}: "Taking notes? Or looking for weaknesses?" ${p2}: "...Both." At least ${pronouns(p2).sub}'s honest.`,
    (p1, p2, a1, a2) => `${p1} is convinced ${p2}'s ${a2.name} is spying on ${pronouns(p1).posAdj} training. It's not. It's looking at a butterfly. But paranoia doesn't check facts.`,
    (p1, p2, a1, a2) => `${p1}: "Why does your ${a2.name.toLowerCase()} keep looking at me?" ${p2}: "Because you're LOUD." ${p1}: "Is it memorizing my routine?!" ${p2}: "It's a ${a2.name.toLowerCase()}."`,
  ],
  blame: [
    (p1, p2, a1, a2) => `${p1}'s ${a1.name} acted up after ${p2} walked too close. ${p1}: "You SPOOKED it!" ${p2}: "I was WALKING." ${p1}: "Walk ELSEWHERE." Heated.`,
    (p1, p2, a1, a2) => `${p1} blames ${p2} for distracting ${pronouns(p1).posAdj} ${a1.name}. ${p2}: "I didn't DO anything!" ${p1}: "Your ${a2.name.toLowerCase()} was making noise!" ${p2}: "Animals MAKE NOISE."`,
    (p1, p2, a1, a2) => `${p1}: "If you hadn't been showing off, my ${a1.name.toLowerCase()} wouldn't have gotten distracted." ${p2}: "Or maybe train your animal better?" SHOTS FIRED.`,
    (p1, p2, a1, a2) => `${p1} is convinced ${p2} sabotaged ${pronouns(p1).posAdj} training area. ${p2} didn't — but ${p1} is looking for someone to blame and ${p2} is closest. Bond damage.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// TEXT POOLS — HOST COMMENTARY
// ══════════════════════════════════════════════════════════════
export const HOST_TEXT = {
  opening: [
    () => `${host()}: "Welcome to today's challenge! Each of you will be paired with a wild animal companion. You'll train it, perform with it, and then race through the forest together. The first team to exit the forest wins immunity. Oh, and Chef will be judging. So... good luck with THAT."`,
    () => `${host()}: "Alright, castmates! I hope you're all animal lovers. Because today, you're getting a PARTNER. A furry — or scaly, or feathery — partner. Train it. Perform with it. Race with it. Don't get eaten by it. Simple!"`,
    () => `${host()}: "Today's challenge is called TOP DOG. You'll each receive an animal buddy. Phase one: train it and perform. Phase two: race through the forest with it. First to the exit wins immunity. Any questions? Great, I don't care. Let's GO!"`,
    () => `${host()}: "Animals! Adventure! Absolutely terrible decisions! Welcome to TOP DOG, people. Grab your partner, try not to die, and remember — the animal is ALWAYS right."`,
  ],
  trainingStart: [
    () => `${host()}: "Alright! Training time! You have four rounds to turn these wild animals into performing partners. Chef and I will judge your routines afterward. Make it GOOD."`,
    () => `${host()}: "Time to train! Remember — these animals don't know you, don't trust you, and in some cases, actively want to eat you. Good luck!"`,
    () => `${host()}: "Training begins NOW! Four rounds, people. That's all you get. Make every second count. Or don't. Either way, it's great TV."`,
    () => `${host()}: "Let the training montage... BEGIN! And yes, we WILL be playing inspiring music. Whether you deserve it or not."`,
  ],
  judgingStart: [
    () => `${host()}: "Training's OVER! Time for the performance. Step up, show us what your animal can do, and try not to embarrass yourself. Chef's scoring, and he's in a BAD mood today."`,
    () => `${host()}: "Performances! One at a time! Chris scores, Chef scores. Total out of 20. Top scorer gets a head start in the race. Bottom scorer gets... nothing. As usual."`,
    () => `${host()}: "Judgment time! Who trained well? Who's going to crash and burn? Let's find out! Bring your animals to the stage!"`,
    () => `${host()}: "Time for the SHOW! Chris and Chef will judge each performance on a scale of 1 to 10. Twenty is PERFECT. One is 'why did I agree to host this show.'"`,
  ],
  forestStart: [
    () => `${host()}: "Welcome to Phase Two: the FOREST RACE! Fourteen segments of dense forest between you and the exit. First team out wins IMMUNITY. Head starts based on your performance scores!"`,
    () => `${host()}: "Into the FOREST, people! It's dark, it's dangerous, and I've hidden some surprises in there. Traps? Maybe. Shortcuts? Perhaps. Bears? ...Already have some of those."`,
    () => `${host()}: "Race time! Your animals know the forest better than you. Trust them. Or don't. Either way — first to segment fourteen wins. GO!"`,
    () => `${host()}: "The forest awaits! Fourteen segments of pure chaos. Your performance score determines your head start. Everyone else? Start from zero. And try to keep up!"`,
  ],
  forestFinish: [
    (winner) => `${host()}: "${winner} EXITS THE FOREST FIRST! ${winner} wins IMMUNITY!" The other teams emerge one by one, exhausted, scratched, muddy. ${winner} stands at the finish, grinning.`,
    (winner) => `${host()}: "And ${winner} BURSTS through the treeline! IMMUNITY IS WON! The rest of you... better start thinking about tribal council."`,
    (winner) => `${host()}: "IT'S OVER! ${winner} and ${pronouns(winner).posAdj} animal cross the finish line! IMMUNITY! The forest has spoken, and it chose ${winner}!"`,
    (winner) => `${host()}: "${winner} clears the final segment! DONE! IMMUNITY! Everyone else is scrambling but it's TOO LATE! Top Dog has been crowned!"`,
  ],
};

const CONFESSIONAL_TEXT = {
  draftGood: [
    (p, a, pr) => `${p}: "The ${a.name}? Yeah, I'm feeling GOOD about this. We clicked instantly. This is MY challenge to lose."`,
    (p, a, pr) => `${p}: "When that ${a.name} looked at me? I just KNEW. We're gonna crush this. Everyone else should be scared."`,
    (p, a, pr) => `${p}: "Perfect match. The ${a.name} gets me. I get the ${a.name}. Immunity is MINE today."`,
    (p, a, pr) => `${p}: "I didn't expect to bond with a ${a.name.toLowerCase()} this fast. But here we are. Dream team."`,
  ],
  draftBad: [
    (p, a, pr) => `${p}: "A ${a.name}. I got... a ${a.name}. It already bit me. This is going to be a LONG day."`,
    (p, a, pr) => `${p}: "The ${a.name} hates me. I can tell. It's looking at me like I'm food. This is fine. Everything is fine."`,
    (p, a, pr) => `${p}: "*deep breath* OK. I can work with a ${a.name.toLowerCase()}. I've dealt with worse. ...Have I? No. No I haven't."`,
    (p, a, pr) => `${p}: "Everyone else got cute animals that LIKE them. I got a ${a.name.toLowerCase()} with anger issues. Cool. Cool cool cool."`,
  ],
  trainingSuccess: [
    (p, a, pr) => `${p}: "We're actually getting somewhere! The ${a.name} did the trick! I almost cried. Don't tell anyone."`,
    (p, a, pr) => `${p}: "Training is going AMAZING. I think the ${a.name} actually respects me now. Or fears me. Either works."`,
    (p, a, pr) => `${p}: "I'm not gonna lie — I'm feeling confident. The ${a.name} and I are in SYNC."`,
  ],
  trainingFail: [
    (p, a, pr) => `${p}: "The ${a.name} just... sat there. Didn't move. Didn't blink. I performed an entire routine and it NAPPED."`,
    (p, a, pr) => `${p}: "Training is going terribly and I'm going to lose and then go home. Great day. Wonderful."`,
    (p, a, pr) => `${p}: "I'm starting to think the ${a.name} is sabotaging ME. Like, intentionally. On purpose. With malice."`,
  ],
  judgingHigh: [
    (p, a, pr) => `${p}: "NAILED IT! Did you SEE that?! The ${a.name} was PERFECT! Chris gave us a— *chef's kiss*"`,
    (p, a, pr) => `${p}: "I can't stop smiling. The performance was flawless. The ${a.name} was a STAR. I might actually win this."`,
  ],
  judgingLow: [
    (p, a, pr) => `${p}: "That was... not good. The ${a.name} did the WRONG trick. I did the wrong trick. Everything was wrong. I want to go home."`,
    (p, a, pr) => `${p}: "Chef scored us a ${Math.floor(Math.random()*3)+1}. A ${Math.floor(Math.random()*3)+1}. I have never been more humiliated on national television."`,
  ],
  forestLead: [
    (p, a, pr) => `${p}: "I'm in FIRST. The ${a.name} knows exactly where to go. We're unstoppable. Nobody can catch us."`,
    (p, a, pr) => `${p}: "The forest? Easy. The ${a.name} is like a GPS with fur. We're CRUISING."`,
  ],
  forestLast: [
    (p, a, pr) => `${p}: "I'm lost. The ${a.name} is lost. We've been walking in circles. I can hear the others ahead. Getting FURTHER ahead."`,
    (p, a, pr) => `${p}: "Last place. I'm in LAST PLACE. The ${a.name} keeps stopping to eat berries. BERRIES. While I'm LOSING."`,
  ],
  moodHigh: [
    (p, a, pr) => `${p}: "The ${a.name} is VIBING right now. Ears up, tail wagging, full zoom energy. We are UNSTOPPABLE."`,
    (p, a, pr) => `${p}: "I've never seen an animal this happy. The ${a.name} is performing tricks I didn't even TEACH it."`,
    (p, a, pr) => `${p}: "We've bonded. Like, actually bonded. The ${a.name} would do anything for me right now. I can feel it."`,
    (p, a, pr) => `${p}: "This ${a.name.toLowerCase()} is in the ZONE. Pure focus, pure joy. Whatever I did, I need to bottle it."`,
  ],
  moodLow: [
    (p, a, pr) => `${p}: "The ${a.name} HATES me. Won't look at me. Won't move. I think it's plotting my downfall."`,
    (p, a, pr) => `${p}: "Something went wrong. The ${a.name} was fine and now it's... not. I don't know what I did but it's NOT happy."`,
    (p, a, pr) => `${p}: "I am being actively sabotaged by a ${a.name.toLowerCase()}. It sat down in the middle of everything and just... stared at me. With contempt."`,
    (p, a, pr) => `${p}: "I think the ${a.name} has given up on me. On life. On everything. I've never seen an animal this done."`,
  ],
  animalRefused: [
    (p, a, pr) => `${p}: "It REFUSED. Just... no. Nothing. I stood there like an idiot and my ${a.name.toLowerCase()} gave me the cold shoulder on NATIONAL TELEVISION."`,
    (p, a, pr) => `${p}: "That was the most humiliating moment of my life. The ${a.name} looked at the obstacle, looked at me, and walked AWAY. Just walked away."`,
    (p, a, pr) => `${p}: "I'd like to formally apologize to everyone who had to watch that. The ${a.name} decided today was NOT the day."`,
  ],
};

function _confessionalCard(player, animalName, type) {
  const pool = CONFESSIONAL_TEXT[type];
  if (!pool || pool.length === 0) return '';
  const pr = pronouns(player);
  const text = pick(pool)(player, { name: animalName }, pr);
  const sl = slug(player);
  return `<div class="td-confessional">
    <div class="td-conf-portrait"><img src="assets/avatars/${sl}.png" alt="${player}" onerror="this.style.display='none'"></div>
    ${text}
  </div>`;
}


// ══════════════════════════════════════════════════════════════
// PHASE 1: TRAINING + JUDGING
// ══════════════════════════════════════════════════════════════
function _simulateTraining(assignments, ep, result) {
  const campKey = gs.mergeName || 'merge';
  const TRAINING_ROUNDS = 4;

  for (const assign of assignments) {
    assign.trainingResults = [];
    assign.successCount = 0;
    assign.totalRounds = TRAINING_ROUNDS;
  }

  // Mole detection
  let mole = null;
  if (gs.mole && assignments.some(a => a.player === gs.mole)) {
    mole = gs.mole;
  }
  result.phase1.mole = mole;

  for (let round = 0; round < TRAINING_ROUNDS; round++) {
    const roundData = { round: round + 1, results: [], socialEvents: [], moleAction: null };

    // Each player trains
    for (const assign of assignments) {
      const { player, animal, compatibility } = assign;
      const s = pStats(player);
      const pr = pronouns(player);

      // Check for refusal at mood 1
      const refusalText = _checkRefusal(assign);
      if (refusalText) {
        roundData.results.push({ player, animal: animal.id, outcome: 'refusal', roll: 0, text: refusalText, mood: assign.mood });
        ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) - 2;
        popDelta(player, -1);
        continue;
      }

      const relevantStat = (s[animal.stats[0]] + s[animal.stats[1]]) * 0.5;
      const moodMult = _moodEffect(assign);
      const trainRoll = ((compatibility + 2) * 0.35 + relevantStat * 0.35 + noise(2.5)) * moodMult;

      // Success threshold proportional to difficulty
      const threshold = 3.5 + animal.danger * 0.3;

      if (trainRoll < threshold - 3) {
        const text = pick(TRAINING_TEXT.criticalFailure)(player, animal, pr);
        assign.compatibility = Math.max(0, assign.compatibility - 0.8);
        _moodShift(assign, 'training_critical_failure', `round ${round + 1}`);
        roundData.results.push({ player, animal: animal.id, outcome: 'critical_failure', roll: trainRoll, text, mood: assign.mood });
        ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) - 1;
        popDelta(player, -1);
      } else if (trainRoll < threshold) {
        const pool = TRAINING_TEXT.failure[animal.temperament] || TRAINING_TEXT.failure.stubborn;
        const text = pick(pool)(player, animal, pr);
        assign.compatibility = Math.max(0, assign.compatibility - 0.3);
        _moodShift(assign, 'training_failure', `round ${round + 1}`);
        roundData.results.push({ player, animal: animal.id, outcome: 'failure', roll: trainRoll, text, mood: assign.mood });
      } else {
        const pool = TRAINING_TEXT.success[animal.temperament] || TRAINING_TEXT.success.playful;
        const text = pick(pool)(player, animal, pr);
        assign.compatibility = Math.min(10, assign.compatibility + 0.5);
        assign.successCount++;
        _moodShift(assign, 'training_success', `round ${round + 1}`);
        roundData.results.push({ player, animal: animal.id, outcome: 'success', roll: trainRoll, text, mood: assign.mood });
        ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 1;
      }

      // Unique trigger check (once per round per animal)
      const trigger = _checkUniqueTrigger(assign, 'training');
      if (trigger) {
        roundData.results.push({ player, animal: animal.id, outcome: 'unique_trigger', roll: 0, text: trigger.text, mood: assign.mood, triggerId: trigger.id });
      }
    }

    // Mole sabotage: 1-2 actions during training
    if (mole && round < 2) {
      const targets = assignments.filter(a => a.player !== mole);
      if (targets.length > 0) {
        const target = pick(targets);
        const pr = pronouns(target.player);
        const text = pick(MOLE_TEXT.training)(mole, target.player, target.animal, pr);
        target.compatibility = Math.max(0, target.compatibility - 0.5);
        _moodShift(target, 'mole_sabotage', 'training mole');
        roundData.moleAction = { mole, target: target.player, text };
        if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.2;
        ep.campEvents[campKey].post.push({
          text: `${mole} sabotaged ${target.player}'s animal training during Top Dog.`,
          players: [mole, target.player],
          badgeText: 'Mole Sabotage',
          badgeClass: 'badge-danger',
        });
      }
    }

    // Social events: 1-2 guaranteed between each training round
    const socialCount = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let s = 0; s < socialCount; s++) {
      const evt = _generateTrainingSocialEvent(assignments, ep, campKey);
      if (evt) roundData.socialEvents.push(evt);
    }

    result.phase1.trainingRounds.push(roundData);
  }
}

function _generateTrainingSocialEvent(assignments, ep, campKey) {
  if (assignments.length < 2) return null;
  const shuffled = [...assignments].sort(() => Math.random() - 0.5);
  const a1 = shuffled[0], a2 = shuffled[1];
  const bond = getBond(a1.player, a2.player);
  const pr1 = pronouns(a1.player), pr2 = pronouns(a2.player);

  // Pick event type based on bond + archetypes
  let type, textPool;
  if (bond > 3 && Math.random() < 0.4) {
    // Check showmance
    const showmance = gs.showmances?.find(sm =>
      (sm.a === a1.player && sm.b === a2.player) || (sm.a === a2.player && sm.b === a1.player));
    if (showmance) {
      type = 'showmance';
      textPool = SOCIAL_TEXT.showmance;
    } else {
      type = 'animalBond';
      textPool = SOCIAL_TEXT.animalBond;
    }
  } else if (bond < -2) {
    type = Math.random() < 0.5 ? 'animalRivalry' : 'blame';
    textPool = type === 'animalRivalry' ? SOCIAL_TEXT.animalRivalry : SOCIAL_TEXT.blame;
  } else if (Math.random() < 0.3) {
    type = 'respect';
    textPool = SOCIAL_TEXT.respect;
  } else if (Math.random() < 0.3) {
    type = 'paranoia';
    textPool = SOCIAL_TEXT.paranoia;
  } else {
    type = 'animalBond';
    textPool = SOCIAL_TEXT.animalBond;
  }

  const text = pick(textPool)(a1.player, a2.player, a1.animal, a2.animal);

  // Gameplay consequences
  let bondDelta = 0, popA = 0, popB = 0;
  switch (type) {
    case 'animalBond':
      bondDelta = 0.5 + Math.random() * 0.5;
      break;
    case 'animalRivalry':
      bondDelta = -(0.5 + Math.random() * 0.5);
      popA = -0.5; popB = -0.5;
      break;
    case 'showmance':
      bondDelta = 1;
      popA = 1; popB = 1;
      break;
    case 'respect':
      bondDelta = 0.5;
      popA = 0.5; popB = 0.5;
      break;
    case 'paranoia':
      bondDelta = -0.3;
      break;
    case 'blame':
      bondDelta = -1;
      popA = -0.5;
      break;
  }

  addBond(a1.player, a2.player, bondDelta);
  if (popA) popDelta(a1.player, popA);
  if (popB) popDelta(a2.player, popB);

  // Mood shifts from social events
  const moodType = type === 'animalBond' || type === 'respect' ? 'social_bond'
    : type === 'animalRivalry' ? 'social_rivalry'
    : type === 'showmance' ? 'social_showmance'
    : type === 'blame' ? 'social_blame' : 'social_bond';
  _moodShift(a1, moodType, `social: ${type}`);
  _moodShift(a2, moodType, `social: ${type}`);

  // Camp event
  ep.campEvents[campKey].post.push({
    text: `${type === 'showmance' ? 'Showmance moment' : type === 'animalRivalry' ? 'Animal rivalry' : type === 'blame' ? 'Blame game' : type === 'paranoia' ? 'Paranoia' : type === 'respect' ? 'Respect shown' : 'Animal bonding'} between ${a1.player} and ${a2.player} during Top Dog training.`,
    players: [a1.player, a2.player],
    badgeText: type === 'showmance' ? 'Showmance' : type === 'animalRivalry' ? 'Rivalry' : type === 'blame' ? 'Blame' : type === 'paranoia' ? 'Paranoia' : type === 'respect' ? 'Respect' : 'Bond',
    badgeClass: ['animalBond', 'showmance', 'respect'].includes(type) ? 'badge-success' : 'badge-warning',
  });

  return { type, players: [a1.player, a2.player], animals: [a1.animal, a2.animal], text, bondDelta };
}

function _simulateJudging(assignments, result) {
  const performances = [];

  for (const assign of assignments) {
    const { player, animal, compatibility, successCount, totalRounds } = assign;
    const s = pStats(player);
    const pr = pronouns(player);

    // Check refusal before performance
    const refusalText = _checkRefusal(assign);
    if (refusalText) {
      _moodShift(assign, 'judging_low', 'refusal');
      performances.push({
        player, animal: animal.id, animalObj: animal,
        chrisScore: 1, chefScore: 1, total: 2, tier: 'catastrophe',
        perfText: refusalText,
        chrisText: `${host()}: "Well... that was something. I'm giving it a 1. Because zero isn't an option."`,
        chefText: `Chef: "I've seen potatoes with more stage presence."`,
        trainingRate: successCount / totalRounds, compatibility, mood: assign.mood, refused: true,
      });
      popDelta(player, -2);
      continue;
    }

    const trainingRate = successCount / totalRounds;
    const perfRoll = (s.social * 0.4 + s.boldness * 0.3 + noise(2.5)) / 10;
    const moodFactor = (assign.mood - 1) / 4;
    const rawScore = trainingRate * 0.3 + perfRoll * 0.3 + moodFactor * 0.4;

    const chrisScore = Math.round(Math.max(1, Math.min(10, rawScore * 10 + noise(1.5))));
    const chefScore = Math.round(Math.max(1, Math.min(10, rawScore * 10 + noise(1.5))));
    const total = chrisScore + chefScore;

    // Mood shift based on score
    const avg = total / 2;
    if (avg >= 7) _moodShift(assign, 'judging_high', 'judging');
    else if (avg <= 3) _moodShift(assign, 'judging_low', 'judging');

    let tier;
    if (avg >= 9) tier = 'standingOvation';
    else if (avg >= 7) tier = 'impressed';
    else if (avg >= 5) tier = 'meh';
    else if (avg >= 3) tier = 'disaster';
    else tier = 'catastrophe';

    const perfText = pick(JUDGING_TEXT.performance[tier])(player, animal, pr);
    const chrisText = pick(JUDGING_TEXT.chrisComment[tier])(player, animal);
    const chefText = pick(JUDGING_TEXT.chefComment[tier])(player, animal);

    performances.push({
      player, animal: animal.id, animalObj: animal,
      chrisScore, chefScore, total, tier,
      perfText, chrisText, chefText,
      trainingRate, compatibility, mood: assign.mood,
    });

    if (tier === 'standingOvation') popDelta(player, 2);
    else if (tier === 'impressed') popDelta(player, 1);
    else if (tier === 'disaster') popDelta(player, -1);
    else if (tier === 'catastrophe') popDelta(player, -2);
  }

  // Sort by total score descending
  performances.sort((a, b) => b.total - a.total);
  result.phase1.performances = performances;

  return performances;
}

// ══════════════════════════════════════════════════════════════
// PHASE 2: FOREST RACE
// ══════════════════════════════════════════════════════════════
function _simulateForestRace(assignments, performances, ep, result) {
  const campKey = gs.mergeName || 'merge';

  // Head start based on Phase 1 rank
  const positions = {};
  const assignMap = {};
  for (const assign of assignments) {
    assignMap[assign.player] = assign;
  }

  // Winner starts at 3, second at 2, third at 1, rest at 0
  for (let i = 0; i < performances.length; i++) {
    const name = performances[i].player;
    if (i === 0) positions[name] = 3;
    else if (i === 1) positions[name] = 2;
    else if (i === 2) positions[name] = 1;
    else positions[name] = 0;
  }

  const activePlayers = performances.map(p => p.player);
  const eliminated = new Set(); // players who've finished
  let winner = null;
  const rounds = [];

  // Mole setup
  let mole = result.phase1.mole;
  let moleSabotagesLeft = mole ? 2 : 0;

  let prevLeader = null;

  // Race loop
  for (let roundNum = 0; roundNum < 25 && !winner; roundNum++) {
    const roundData = { round: roundNum + 1, movements: [], encounters: [], socialEvents: [], moleActions: [] };
    const stillRacing = activePlayers.filter(n => !eliminated.has(n));
    if (stillRacing.length === 0) break;

    // Track leader before this round
    const leaderBefore = prevLeader;

    // Mole GPS bonus
    if (mole && !eliminated.has(mole)) {
      positions[mole] = (positions[mole] || 0) + 3;
      const text = pick(MOLE_TEXT.forest.gps)(mole);
      roundData.moleActions.push({ type: 'gps', mole, text });
      if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.3;
    }

    // Mole trap/fake marker
    if (mole && moleSabotagesLeft > 0 && Math.random() < 0.6 && !eliminated.has(mole)) {
      const targets = stillRacing.filter(n => n !== mole);
      if (targets.length > 0) {
        const target = pick(targets);
        const sabType = Math.random() < 0.5 ? 'trap' : 'fakeMarker';
        const text = pick(MOLE_TEXT.forest[sabType])(mole, target);
        const penalty = sabType === 'trap' ? -2 : -2;
        positions[target] = Math.max(0, (positions[target] || 0) + penalty);
        roundData.moleActions.push({ type: sabType, mole, target, text, penalty });
        moleSabotagesLeft--;
        if (gs.moleSuspicion) gs.moleSuspicion[mole] = (gs.moleSuspicion[mole] || 0) + 0.3;
        ep.campEvents[campKey].post.push({
          text: `${mole} sabotaged ${target} during the Top Dog forest race.`,
          players: [mole, target],
          badgeText: 'Mole Sabotage',
          badgeClass: 'badge-danger',
        });
      }
    }

    // Each player moves
    for (const name of stillRacing) {
      if (name === mole) continue; // mole already moved via GPS
      const assign = assignMap[name];
      if (!assign) continue;
      const s = pStats(name);
      const pr = pronouns(name);

      // Forest refusal check — animal stops dead
      const forestRefusal = _checkRefusal(assign);
      if (forestRefusal) {
        roundData.movements.push({ player: name, segments: 0, position: positions[name] || 0, moveType: 'refusal', text: forestRefusal, mood: assign.mood });
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) - 1;
        popDelta(name, -1);
        continue;
      }

      const moodMult = _moodEffect(assign);
      const moveRoll = (s.physical * 0.3 + s.endurance * 0.2 + (assign.compatibility + 2) * 0.15 + noise(2.5)) * moodMult;
      let segments = Math.max(0.8, moveRoll / 3.5);

      // Encounter (1-2 per round)
      const encounterCount = 1 + (Math.random() < 0.35 ? 1 : 0);
      for (let e = 0; e < encounterCount; e++) {
        const encounter = _generateEncounter(name, assign, segments, pr);
        segments += encounter.segDelta;
        roundData.encounters.push(encounter);

        // Mood shift from encounter
        if (encounter.segDelta > 0) {
          _moodShift(assign, 'encounter_success', 'forest encounter');
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 1;
        } else if (encounter.segDelta < -1) {
          _moodShift(assign, 'encounter_failure', 'forest encounter');
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) - 1;
        }
      }

      // Unique trigger check in forest
      const trigger = _checkUniqueTrigger(assign, 'forest');
      if (trigger) {
        roundData.encounters.push({ player: name, type: 'unique_trigger', text: trigger.text, segDelta: 0, triggerId: trigger.id });
      }

      segments = Math.max(0.3, segments);
      positions[name] = (positions[name] || 0) + segments;

      // Movement text — position-aware
      const pos = positions[name] || 0;
      const prevPos = pos - segments;
      const allPositions = Object.entries(positions).filter(([n]) => stillRacing.includes(n) || eliminated.has(n));
      const maxPos = Math.max(...allPositions.map(([,v]) => v));
      const minPos = Math.min(...allPositions.filter(([n]) => !eliminated.has(n)).map(([,v]) => v));
      const isLeader = pos >= maxPos - 0.5 && !eliminated.has(name);
      const isLast = pos <= minPos + 0.5 && stillRacing.length > 2;
      const justEnteredDeep = prevPos < 5 && pos >= 5;
      const justEnteredHome = prevPos < 11 && pos >= 11;
      const nearFinish = pos >= 13 && pos < FOREST_LENGTH;
      const chasingLeader = !isLeader && maxPos - pos < 3 && maxPos - pos > 0.5 && pos > 5;

      let moveType;
      if (justEnteredDeep) moveType = 'enterDeepWoods';
      else if (justEnteredHome) moveType = 'enterHomeStretch';
      else if (nearFinish) moveType = 'nearFinish';
      else if (isLeader && pos > 4) moveType = 'leading';
      else if (chasingLeader) moveType = 'chasing';
      else if (isLast && roundNum > 1) moveType = 'falling';
      else if (segments >= 2) moveType = 'fast';
      else if (segments >= 1) moveType = 'medium';
      else moveType = 'slow';
      const moveText = pick(FOREST_TEXT.movement[moveType])(name, assign.animal, pr);
      roundData.movements.push({ player: name, segments, position: pos, moveType, text: moveText, mood: assign.mood });

      // Phase 2 scores
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;

      // Check finish
      if (positions[name] >= FOREST_LENGTH) {
        const isFirst = !winner;
        if (isFirst) {
          winner = name;
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 5;
        }
        eliminated.add(name);
        const animalName = assign.animal?.name || '?';
        if (!roundData.finishers) roundData.finishers = [];
        roundData.finishers.push({ player: name, animal: animalName, isWinner: isFirst });
      }
    }

    // Also move the mole normally (already got GPS bonus above)
    if (mole && !eliminated.has(mole) && stillRacing.includes(mole)) {
      const moleAssign = assignMap[mole];
      if (moleAssign) {
        const s = pStats(mole);
        const pr = pronouns(mole);
        const moveRoll = s.physical * 0.3 + s.endurance * 0.2 + (moleAssign.compatibility + 2) * 0.15 + noise(2.5);
        let segments = Math.max(0.8, moveRoll / 3.5);
        positions[mole] = (positions[mole] || 0) + segments;
        const moveType = segments >= 2 ? 'fast' : segments >= 1 ? 'medium' : 'slow';
        const moveText = pick(FOREST_TEXT.movement[moveType])(mole, moleAssign.animal, pr);
        roundData.movements.push({ player: mole, segments, position: positions[mole], moveType, text: moveText });
        ep.chalMemberScores[mole] = (ep.chalMemberScores[mole] || 0) + 2;
        if (positions[mole] >= FOREST_LENGTH) {
          const isFirst = !winner;
          if (isFirst) {
            winner = mole;
            ep.chalMemberScores[mole] = (ep.chalMemberScores[mole] || 0) + 5;
          }
          eliminated.add(mole);
          if (!roundData.finishers) roundData.finishers = [];
          roundData.finishers.push({ player: mole, animal: moleAssign.animal?.name || '?', isWinner: isFirst });
        }
      }
    }

    // Social events between players in same/adjacent segments
    const socialCount = Math.random() < 0.5 ? 1 : 0;
    for (let s = 0; s < socialCount; s++) {
      const pairs = _findNearbyPairs(stillRacing.filter(n => !eliminated.has(n)), positions);
      if (pairs.length > 0) {
        const [p1, p2] = pick(pairs);
        const evt = _generateForestSocialEvent(p1, p2, assignMap, ep, campKey);
        if (evt) roundData.socialEvents.push(evt);
      }
    }

    // Player interaction encounters for nearby players
    const nearPairs = _findNearbyPairs(stillRacing.filter(n => !eliminated.has(n)), positions);
    if (nearPairs.length > 0 && Math.random() < 0.4) {
      const [p1, p2] = pick(nearPairs);
      const evt = _generatePlayerInteraction(p1, p2, assignMap, ep, campKey);
      if (evt) roundData.encounters.push(evt);
    }

    // Detect lead change
    const racingNow = stillRacing.filter(n => !eliminated.has(n));
    if (racingNow.length > 0) {
      const sorted = [...racingNow].sort((a, b) => (positions[b] || 0) - (positions[a] || 0));
      const newLeader = sorted[0];
      if (leaderBefore && newLeader !== leaderBefore && racingNow.includes(leaderBefore)) {
        const asgn = assignMap[newLeader];
        const animalName = asgn?.animal?.name || '?';
        roundData.leadChange = { newLeader, oldLeader: leaderBefore, animal: animalName };
      }
      prevLeader = newLeader;

      // Photo finish: two players within 1 segment of each other near the finish
      if (sorted.length >= 2) {
        const gap = (positions[sorted[0]] || 0) - (positions[sorted[1]] || 0);
        if (gap <= 1 && gap >= 0 && (positions[sorted[0]] || 0) >= 11) {
          roundData.photoFinish = { player1: sorted[0], player2: sorted[1], gap: gap.toFixed(1) };
        }
      }
    }

    // Store previous positions for arrow tracking
    roundData.prevPositions = {};
    racingNow.forEach(n => { roundData.prevPositions[n] = positions[n] || 0; });

    rounds.push(roundData);
  }

  // If no winner after max rounds, closest to finish wins
  if (!winner) {
    const remaining = activePlayers.filter(n => !eliminated.has(n));
    if (remaining.length > 0) {
      remaining.sort((a, b) => (positions[b] || 0) - (positions[a] || 0));
      winner = remaining[0];
      ep.chalMemberScores[winner] = (ep.chalMemberScores[winner] || 0) + 5;
    }
  }

  // Build finish order
  const finishOrder = [...activePlayers].sort((a, b) => (positions[b] || 0) - (positions[a] || 0));

  result.phase2.rounds = rounds;
  result.phase2.positions = { ...positions };
  result.phase2.winner = winner;
  result.phase2.finishOrder = finishOrder;
  result.phase2.finishText = winner ? pick(HOST_TEXT.forestFinish)(winner) : '';

  return winner;
}

function _generateEncounter(name, assign, currentSegments, pr) {
  const s = pStats(name);
  const animal = assign.animal;
  const encounterType = pick(['navigation', 'obstacle', 'trap', 'animalMoment']);

  if (encounterType === 'animalMoment') {
    const pool = FOREST_TEXT.animalMoment[animal.id];
    if (pool && pool.length > 0) {
      const text = pick(pool)(name, animal, pr);
      // Animal moments are mostly positive for high-compat teams
      const delta = assign.compatibility > 5 ? (Math.random() < 0.6 ? 1 : 0) : (Math.random() < 0.3 ? 1 : -0.5);
      return { type: 'animalMoment', player: name, animal: animal.id, text, segDelta: delta };
    }
  }

  if (encounterType === 'navigation') {
    const navRoll = s.mental * 0.4 + s.intuition * 0.3 + noise(2.5);
    const threshold = 4 + animal.danger * 0.2;
    if (navRoll >= threshold) {
      const text = pick(FOREST_TEXT.navigation.success)(name, animal, pr);
      return { type: 'navigation', player: name, outcome: 'success', text, segDelta: 2 };
    } else {
      const lostSegments = -(0.5 + Math.floor(Math.random() * 2));
      const text = pick(FOREST_TEXT.navigation.failure)(name, animal, pr);
      return { type: 'navigation', player: name, outcome: 'failure', text, segDelta: lostSegments };
    }
  }

  if (encounterType === 'obstacle') {
    const obsRoll = s.physical * 0.4 + s.endurance * 0.2 + noise(2.5);
    const threshold = 4;
    if (obsRoll >= threshold) {
      const text = pick(FOREST_TEXT.obstacle.success)(name, animal, pr);
      return { type: 'obstacle', player: name, outcome: 'success', text, segDelta: 0 };
    } else {
      const text = pick(FOREST_TEXT.obstacle.failure)(name, animal, pr);
      return { type: 'obstacle', player: name, outcome: 'failure', text, segDelta: -1 };
    }
  }

  // Trap
  const trapRoll = s.intuition * 0.4 + s.boldness * 0.2 + noise(2.5);
  const threshold = 4.5;
  if (trapRoll >= threshold) {
    const text = pick(FOREST_TEXT.trap.success)(name, animal, pr);
    return { type: 'trap', player: name, outcome: 'success', text, segDelta: 0 };
  } else {
    const text = pick(FOREST_TEXT.trap.failure)(name, animal, pr);
    return { type: 'trap', player: name, outcome: 'failure', text, segDelta: -1 };
  }
}

function _findNearbyPairs(players, positions) {
  const pairs = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const dist = Math.abs((positions[players[i]] || 0) - (positions[players[j]] || 0));
      if (dist <= 2) pairs.push([players[i], players[j]]);
    }
  }
  return pairs;
}

function _generateForestSocialEvent(p1, p2, assignMap, ep, campKey) {
  const bond = getBond(p1, p2);
  const a1 = assignMap[p1], a2 = assignMap[p2];
  if (!a1 || !a2) return null;

  let type;
  if (bond > 3) type = Math.random() < 0.4 ? 'respect' : 'animalBond';
  else if (bond < -2) type = Math.random() < 0.5 ? 'animalRivalry' : 'blame';
  else type = pick(['respect', 'paranoia', 'animalBond']);

  const text = pick(SOCIAL_TEXT[type])(p1, p2, a1.animal, a2.animal);

  let bondDelta = 0;
  switch (type) {
    case 'animalBond': case 'respect': bondDelta = 0.5; break;
    case 'animalRivalry': case 'blame': bondDelta = -0.5; break;
    case 'paranoia': bondDelta = -0.3; break;
  }

  addBond(p1, p2, bondDelta);

  ep.campEvents[campKey].post.push({
    text: `${type === 'animalRivalry' ? 'Animal rivalry' : type === 'blame' ? 'Blame game' : type === 'respect' ? 'Mutual respect' : type === 'paranoia' ? 'Paranoid moment' : 'Animal bonding'} between ${p1} and ${p2} during the Top Dog forest race.`,
    players: [p1, p2],
    badgeText: type === 'respect' ? 'Respect' : type === 'animalBond' ? 'Bond' : type === 'animalRivalry' ? 'Rivalry' : type === 'blame' ? 'Blame' : 'Paranoia',
    badgeClass: ['animalBond', 'respect'].includes(type) ? 'badge-success' : 'badge-warning',
  });

  return { type, players: [p1, p2], text, bondDelta };
}

function _generatePlayerInteraction(p1, p2, assignMap, ep, campKey) {
  const bond = getBond(p1, p2);
  const a1 = assignMap[p1], a2 = assignMap[p2];
  if (!a1 || !a2) return null;
  const pr1 = pronouns(p1), pr2 = pronouns(p2);

  let interType;
  if (bond > 2) interType = Math.random() < 0.6 ? 'help' : 'race';
  else if (bond < -2 && canScheme(p1)) interType = 'sabotage';
  else interType = 'race';

  const text = pick(FOREST_TEXT.playerInteraction[interType])(p1, p2, pr1, pr2);

  let segDelta1 = 0, segDelta2 = 0, bondDelta = 0;
  switch (interType) {
    case 'help':
      segDelta2 = 1; // helped player gains
      segDelta1 = -0.5; // helper loses a bit
      bondDelta = 1;
      popDelta(p1, 1); // heroic
      break;
    case 'race':
      // Both push harder — small bonus for both
      segDelta1 = 0.5;
      segDelta2 = 0.5;
      break;
    case 'sabotage':
      segDelta2 = -1.5; // sabotaged player loses ground
      bondDelta = -1.5;
      popDelta(p1, -1); // villainous
      popDelta(p2, 0.5); // sympathy
      ep.campEvents[campKey].post.push({
        text: `${p1} sabotaged ${p2} during the Top Dog forest race.`,
        players: [p1, p2],
        badgeText: 'Sabotage',
        badgeClass: 'badge-danger',
      });
      break;
  }

  if (bondDelta) addBond(p1, p2, bondDelta);

  return {
    type: 'playerInteraction', subType: interType,
    players: [p1, p2],
    text,
    segDelta: { [p1]: segDelta1, [p2]: segDelta2 },
  };
}


// ══════════════════════════════════════════════════════════════
// MAIN SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateTopDog(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    phase1: { assignments: [], trainingRounds: [], performances: [], mole: null },
    phase2: { rounds: [], positions: {}, winner: null, finishOrder: [], finishText: '' },
    immunityWinner: null,
    hostOpening: pick(HOST_TEXT.opening)(),
    hostTrainingStart: pick(HOST_TEXT.trainingStart)(),
    hostJudgingStart: pick(HOST_TEXT.judgingStart)(),
    hostForestStart: pick(HOST_TEXT.forestStart)(),
  };

  // ── Animal Assignment ──
  const assignments = _assignAnimals(active);
  result.phase1.assignments = assignments;

  // Add Phase 1 judging scores to chalMemberScores
  // (training scores are added in _simulateTraining)

  // ── Phase 1: Training ──
  _simulateTraining(assignments, ep, result);

  // Mood decay: training → judging
  for (const assign of assignments) _moodDecay(assign);

  // ── Phase 1: Judging ──
  const performances = _simulateJudging(assignments, result);

  // Add judging totals to chalMemberScores
  for (const perf of performances) {
    ep.chalMemberScores[perf.player] = (ep.chalMemberScores[perf.player] || 0) + perf.total;
  }

  // Mood decay: judging → forest
  for (const assign of assignments) _moodDecay(assign);

  // ── Phase 2: Forest Race ──
  const winner = _simulateForestRace(assignments, performances, ep, result);
  result.immunityWinner = winner;

  // ── Romance Hooks ──
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'animal buddy challenge');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'top-dog', _romActive);

  // ── Finalize ──
  ep.topDog = result;
  ep.isTopDog = true;
  ep.challengeType = 'top-dog';
  ep.challengeLabel = 'Top Dog';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = result.immunityWinner;

  // Ensure immunity winner is #1 in chalMemberScores
  const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== result.immunityWinner).map(([, s]) => s));
  ep.chalMemberScores[result.immunityWinner] = Math.max(ep.chalMemberScores[result.immunityWinner] || 0, maxOther) + active.length + 5;

  // Rank placements by final score (best→worst) so the leaderboard, podium/bomb,
  // standouts/stragglers, and Sudden Death last-place elimination all agree. The
  // raw forest-race finish order does NOT match the score leaderboard.
  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([, a], [, b]) => b - a)
    .map(([n]) => n);

  ep.tribalPlayers = active;
  updateChalRecord(ep);

  return ep;
}


// ══════════════════════════════════════════════════════════════
// VP (VISUAL PLAYBACK) SYSTEM
// ══════════════════════════════════════════════════════════════

// ── REVEAL STATE (alien-egg proven pattern: IDs + display:none) ──
const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _syncRevealed(screenKey, st) {
  for (let i = 0; i <= st.idx; i++) {
    const el = document.getElementById(`td-step-${screenKey}-${i}`);
    if (el) el.style.display = '';
    const elB = document.getElementById(`td-step-${screenKey}-${i}b`);
    if (elB) elB.style.display = '';
  }
}

export function topDogRevealNext(screenKey, total) {
  const st = _ensureState(screenKey, total);
  _syncRevealed(screenKey, st);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const el = document.getElementById(`td-step-${screenKey}-${st.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const elB = document.getElementById(`td-step-${screenKey}-${st.idx}b`);
  if (elB) elB.style.display = '';
  _rebuildSidebar();
  const counter = document.getElementById(`td-counter-${screenKey}`);
  if (counter) counter.textContent = `${st.idx + 1}/${st.total}`;
  if (st.idx >= st.total - 1) {
    const ctrl = document.getElementById(`td-controls-${screenKey}`);
    if (ctrl) ctrl.querySelector('.td-btn')?.setAttribute('disabled', 'true');
  }
}
export function topDogRevealAll(screenKey, total) {
  const st = _ensureState(screenKey, total);
  st.idx = st.total - 1;
  _syncRevealed(screenKey, st);
  _rebuildSidebar();
  const counter = document.getElementById(`td-counter-${screenKey}`);
  if (counter) counter.textContent = `${st.total}/${st.total}`;
  const ctrl = document.getElementById(`td-controls-${screenKey}`);
  if (ctrl) ctrl.querySelector('.td-btn')?.setAttribute('disabled', 'true');
}
window.tdRevealNext = topDogRevealNext;
window.tdRevealAll = topDogRevealAll;
// Event delegation — inline onclick doesn't fire on innerHTML-injected buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-td-action]');
  if (!btn) return;
  const action = btn.dataset.tdAction;
  const key = btn.dataset.tdKey;
  const total = parseInt(btn.dataset.tdTotal, 10);
  if (action === 'next') topDogRevealNext(key, total);
  else if (action === 'all') topDogRevealAll(key, total);
});

function _rebuildSidebar() {
  const sidebarEl = document.getElementById('td-sidebar');
  if (!sidebarEl) return;
  const shell = sidebarEl.closest('.td-shell');
  const phase = shell?.dataset?.phase || '';
  const data = window._tdData;
  if (!data) return;
  sidebarEl.innerHTML = _buildSidebarContent(data, phase, window._tdEp);
}

// ══════════════════════════════════════════════════════════════
// CUSTOM ANIMATED CSS ICONS (Layer 1) — Pet Shop Paradise
// ══════════════════════════════════════════════════════════════
function _icon(type) {
  const map = {
    paw: 'td-icon-paw', movement: 'td-icon-paw', race: 'td-icon-paw',
    bone: 'td-icon-bone', training: 'td-icon-bone',
    leaf: 'td-icon-leaf', forest: 'td-icon-leaf', navigation: 'td-icon-leaf',
    heart: 'td-icon-heart', showmance: 'td-icon-heart', animalBond: 'td-icon-heart',
    star: 'td-icon-star', success: 'td-icon-star', standingOvation: 'td-icon-star', impressed: 'td-icon-star',
    fishbone: 'td-icon-fishbone', failure: 'td-icon-fishbone', critical_failure: 'td-icon-fishbone', catastrophe: 'td-icon-fishbone', disaster: 'td-icon-fishbone',
    feather: 'td-icon-feather', performance: 'td-icon-feather', judging: 'td-icon-feather', spotlight: 'td-icon-feather',
    droplet: 'td-icon-droplet',
    flower: 'td-icon-flower', respect: 'td-icon-flower', help: 'td-icon-flower',
    thorn: 'td-icon-thorn', sabotage: 'td-icon-thorn', mask: 'td-icon-thorn', blame: 'td-icon-thorn',
    eye: 'td-icon-eye', mole: 'td-icon-eye', paranoia: 'td-icon-eye',
    bell: 'td-icon-bell',
    ribbon: 'td-icon-ribbon', immunity: 'td-icon-ribbon',
    pawtrail: 'td-icon-pawtrail', obstacle: 'td-icon-pawtrail',
    cage: 'td-icon-cage', trap: 'td-icon-cage',
    skull: 'td-icon-fishbone',
    whip: 'td-icon-bone',
    lantern: 'td-icon-leaf',
    claw: 'td-icon-thorn', animalRivalry: 'td-icon-thorn',
    shield: 'td-icon-flower',
    compass: 'td-icon-leaf',
    tree: 'td-icon-leaf',
    meh: 'td-icon-feather',
  };
  const cls = map[type] || 'td-icon-paw';
  return `<span class="td-icon ${cls}"></span>`;
}

// ══════════════════════════════════════════════════════════════
// ANIMAL WHISPERS (Layer 3 — pet thoughts / nature sounds)
// ══════════════════════════════════════════════════════════════
const ANIMAL_WHISPERS = {
  'td-petshop': [
    "A parrot shrieks 'DRAMA!' in a perfect Chris impression. Nobody taught it that. Nobody knows how.",
    "Something just knocked over a feed bucket. Blame is being assigned. Loudly.",
    "The raccoon figured out the latch again. Third time today. Security is a myth.",
    "A monkey steals someone's granola bar and retreats to the rafters. Negotiations have begun.",
    "Two animals stare each other down through cage bars. The beef is REAL.",
    "The sound of aggressive treat-crunching fills the arena. War fuel.",
    "A cat knocks something off a table and makes direct eye contact while doing it. Power move.",
    "An iguana has been motionless for forty-five minutes. Either meditating or plotting. Unclear.",
    "The parrot just learned a new phrase from confessional footage. This can only end badly.",
    "Somewhere, a hamster is running on its wheel at Mach 3. No one can explain the motivation.",
  ],
  'td-forest': [
    "Sunlight filters through the canopy. A bird sings. Somewhere, someone just ate dirt.",
    "The creek babbles. A squirrel watches the race from a branch, distinctly unimpressed.",
    "The wind carries the scent of pine and desperation. Mostly desperation.",
    "A frog croaks from a mossy rock. Translation: 'You're going the wrong way.' Nobody speaks frog.",
    "Rustling in the underbrush. Just a hedgehog. It waddles across the path with zero urgency.",
    "The old oak tree creaks. It's seen a thousand seasons. This race is the most fun it's had in decades.",
    "A deer watches from the meadow edge. Ears forward. Judging. Always judging.",
    "Something howls in the distance. Probably just the wind. Probably.",
    "Spider webs across the trail at face height. Nature is undefeated.",
    "The trail gets narrower. The animals know the way. The humans... less so.",
  ],
};

function _pickWhisper(zone, count = 1) {
  const pool = ANIMAL_WHISPERS[zone];
  if (!pool || pool.length === 0) return [];
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

function _whisperDiv(text) {
  return `<div class="td-whisper">${text}</div>`;
}

// ══════════════════════════════════════════════════════════════
// TREAT COUNTER / NATURE BAR (Layers 2 & 7)
// ══════════════════════════════════════════════════════════════
const TREAT_BAR_DATA = {
  '': { icon: 'paw', label: 'TOP DOG', sub: 'Immunity Challenge' },
  'td-petshop-assign': { icon: 'paw', label: 'ANIMAL DRAFT', sub: 'Pick Your Partner' },
  'td-petshop-training': { icon: 'bone', label: 'BOOT CAMP', sub: 'Four Training Rounds' },
  'td-petshop-judging': { icon: 'star', label: 'TALENT SHOWDOWN', sub: 'Chris + Chef Scoring' },
  'td-forest': { icon: 'leaf', label: 'WILDERNESS RACE', sub: '14 Segments to the Finish' },
  'td-winner': { icon: 'ribbon', label: 'TOP DOG', sub: 'Immunity Won' },
};

// ══════════════════════════════════════════════════════════════
// CSS (Layer 1-10 all integrated)
// ══════════════════════════════════════════════════════════════
function _css() {
  return `<style>
/* ═══ TOP DOG VP — TOTAL DRAMA BEAST MODE ═══ */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');

:root{
  --pet-pink:#c06040;--pet-hot-pink:#d05020;--pet-mint:#5a9a48;--pet-lavender:#8a7a6a;--pet-peach:#c8a060;--pet-sky:#4a8ab0;
  --pet-cream:#f5efe0;--pet-warm-white:#ede4d0;--pet-brown:#5c3d2e;--pet-green:#2d5a1e;--pet-grass:#5a9a38;
  --pet-lemon:#d4a017;--pet-bubblegum:#a08060;--pet-coral:#c07040;--pet-seafoam:#6a9a60;
  --pet-text:#2a1a0a;--pet-muted:#7a6a5a;
  --pet-danger:#cc3030;--pet-success:#3a8a2a;
  --td-orange:#e87830;--td-bark:#5c3d2e;--td-dirt:#8b7530;--td-bone:#e8dcc8;
}

.td-shell{position:relative;display:flex;flex-direction:column;min-height:520px;max-width:1100px;margin:0 auto;font-family:'Inter',system-ui,sans-serif;color:var(--pet-text);background:var(--pet-warm-white);border-radius:4px;overflow:clip;border:4px solid var(--td-bark);box-shadow:0 6px 30px rgba(92,61,46,0.4),0 2px 8px rgba(92,61,46,0.2),inset 0 0 0 1px rgba(92,61,46,0.15)}
.td-shell *{box-sizing:border-box}
.td-main{flex:1;padding:0 20px 60px 20px;overflow-y:auto;position:relative;z-index:1}
.td-sidebar{width:240px;min-width:240px;background:linear-gradient(180deg,rgba(92,61,46,0.1),rgba(92,61,46,0.03));border-left:3px solid rgba(92,61,46,0.3);padding:12px 10px;overflow-y:auto;font-size:0.82rem;position:relative;z-index:1}

/* Cartoon dirt/parchment background */
.td-shell::before{content:'';position:absolute;inset:0;z-index:0;
  background:
    radial-gradient(ellipse 300px 200px at 10% 90%, rgba(200,180,140,0.15), transparent),
    radial-gradient(ellipse 250px 180px at 90% 15%, rgba(92,61,46,0.06), transparent),
    linear-gradient(160deg, rgba(232,220,200,0.7) 0%, rgba(245,239,224,0.95) 30%, rgba(220,200,170,0.15) 70%, rgba(92,61,46,0.04) 100%)}
.td-shell::after{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0}

/* Nail/rivet accents on shell corners */
.td-shell>.td-nail{position:absolute;width:6px;height:6px;border-radius:50%;background:radial-gradient(circle,#a0906e 30%,#7a6a50 70%);box-shadow:inset 0 1px 0 rgba(255,255,255,0.3),0 1px 2px rgba(0,0,0,0.2);z-index:3}
.td-nail-tl{top:6px;left:6px}.td-nail-tr{top:6px;right:6px}.td-nail-bl{bottom:6px;left:6px}.td-nail-br{bottom:6px;right:6px}

/* Phase 2: Wilderness — dark forest canopy */
.td-shell.td-forest::before{background:
  linear-gradient(180deg, #3a5520 0%, #2d4818 40%, #1e3810 70%, #152a0a 100%)}
.td-shell.td-forest::after{opacity:0}
.td-shell.td-forest{border-color:#3a5520;border-width:4px;color:#f0e8d8;box-shadow:0 6px 30px rgba(30,56,16,0.5),0 2px 8px rgba(30,56,16,0.25)}
.td-shell.td-forest .td-sidebar{background:linear-gradient(180deg,rgba(30,56,16,0.12),rgba(21,42,10,0.06));border-left-color:rgba(45,90,30,0.4)}
.td-shell.td-forest .td-nail{background:radial-gradient(circle,#5a7a40 30%,#3a5520 70%)}

/* ═══ ANIMATED ANIMAL PARTICLES (CSS-only wow factor) ═══ */

/* Prancing cat — phase 1 */
.td-anim-cat{position:absolute;z-index:0;pointer-events:none;width:20px;height:16px;animation:td-catPrance 6s ease-in-out infinite}
.td-anim-cat::before{content:'';position:absolute;width:12px;height:10px;background:#a08060;border-radius:50% 50% 40% 40%;top:3px;left:2px}
.td-anim-cat::after{content:'';position:absolute;width:6px;height:6px;background:#a08060;border-radius:50%;top:0;left:4px}
@keyframes td-catPrance{0%{transform:translate(0,0) scaleX(1);opacity:0.12}20%{opacity:0.18;transform:translate(15px,-8px) scaleX(1)}40%{transform:translate(30px,0) scaleX(1);opacity:0.15}60%{transform:translate(15px,5px) scaleX(-1);opacity:0.18}80%{transform:translate(-5px,-3px) scaleX(-1);opacity:0.12}100%{transform:translate(0,0) scaleX(1);opacity:0.12}}

/* Tail-wagging dog — phase 1 */
.td-anim-dog{position:absolute;z-index:0;pointer-events:none;width:22px;height:16px;animation:td-dogWag 4s ease-in-out infinite}
.td-anim-dog::before{content:'';position:absolute;width:14px;height:10px;background:#8a6a40;border-radius:45% 55% 40% 40%;top:4px;left:2px}
.td-anim-dog::after{content:'';position:absolute;width:8px;height:3px;background:#8a6a40;border-radius:50%;top:4px;right:0;transform-origin:left center;animation:td-tailWag 0.4s ease-in-out infinite alternate}
@keyframes td-dogWag{0%,100%{transform:translateY(0);opacity:0.12}50%{transform:translateY(-4px);opacity:0.18}}
@keyframes td-tailWag{0%{transform:rotate(-20deg)}100%{transform:rotate(20deg)}}

/* Hopping bunny — phase 1 */
.td-anim-bunny{position:absolute;z-index:0;pointer-events:none;width:14px;height:14px;animation:td-bunnyHop 2.5s ease infinite}
.td-anim-bunny::before{content:'';position:absolute;width:10px;height:8px;background:#b0a090;border-radius:50%;bottom:0;left:2px}
.td-anim-bunny::after{content:'';position:absolute;width:4px;height:7px;background:#b0a090;border-radius:50% 50% 20% 20%;top:0;left:3px;transform-origin:bottom center}
@keyframes td-bunnyHop{0%,100%{transform:translateY(0)}30%{transform:translateY(-12px)}60%{transform:translateY(0)}75%{transform:translateY(-5px)}}

/* Swimming fish — sidebar accent */
.td-anim-fish{position:absolute;z-index:0;pointer-events:none;width:16px;height:10px;animation:td-fishSwim 5s ease-in-out infinite}
.td-anim-fish::before{content:'';position:absolute;width:11px;height:8px;background:#6a8a60;border-radius:60% 40% 40% 60%;top:1px;left:0}
.td-anim-fish::after{content:'';position:absolute;width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-left:6px solid #6a8a60;top:1px;right:0;transform-origin:left center;animation:td-finFlap 0.5s ease-in-out infinite alternate}
@keyframes td-fishSwim{0%{transform:translateX(0) scaleX(1);opacity:0.15}45%{transform:translateX(25px) scaleX(1);opacity:0.2}55%{transform:translateX(25px) scaleX(-1);opacity:0.2}100%{transform:translateX(0) scaleX(-1);opacity:0.15}}
@keyframes td-finFlap{0%{transform:rotate(-15deg)}100%{transform:rotate(15deg)}}

/* Flying bird — phase 1 */
.td-anim-bird{position:absolute;z-index:0;pointer-events:none;width:18px;height:12px;animation:td-birdFly 7s ease-in-out infinite}
.td-anim-bird::before{content:'';position:absolute;width:6px;height:6px;background:#7a8a6a;border-radius:50%;top:4px;left:6px}
.td-anim-bird::after{content:'';position:absolute;width:16px;height:4px;top:2px;left:1px;
  background:
    linear-gradient(135deg, #7a8a6a 0%, transparent 45%),
    linear-gradient(225deg, #7a8a6a 0%, transparent 45%);
  animation:td-wingFlap 0.35s ease-in-out infinite alternate}
@keyframes td-birdFly{0%{transform:translate(0,0);opacity:0.15}25%{opacity:0.22;transform:translate(30px,-20px)}50%{transform:translate(60px,-10px);opacity:0.18}75%{opacity:0.22;transform:translate(30px,-25px)}100%{transform:translate(0,0);opacity:0.15}}
@keyframes td-wingFlap{0%{transform:scaleY(1)}100%{transform:scaleY(-0.6)}}

/* Butterfly particles (forest only) */
.td-butterfly{position:absolute;width:10px;height:8px;z-index:0;pointer-events:none;animation:td-butterflyFloat 8s ease-in-out infinite}
.td-butterfly::before,.td-butterfly::after{content:'';position:absolute;width:6px;height:7px;border-radius:50% 50% 20% 50%;top:0}
.td-butterfly::before{left:0;transform-origin:right center;animation:td-wingLeft 0.4s ease-in-out infinite alternate}
.td-butterfly::after{right:0;transform-origin:left center;animation:td-wingRight 0.4s ease-in-out infinite alternate}
@keyframes td-butterflyFloat{0%{transform:translate(0,0);opacity:0.4}25%{opacity:0.7;transform:translate(25px,-18px)}50%{transform:translate(-12px,-35px);opacity:0.5}75%{opacity:0.8;transform:translate(18px,-12px)}100%{transform:translate(0,0);opacity:0.4}}
@keyframes td-wingLeft{0%{transform:rotateY(0deg)}100%{transform:rotateY(60deg)}}
@keyframes td-wingRight{0%{transform:rotateY(0deg)}100%{transform:rotateY(-60deg)}}

/* Firefly (forest only) */
.td-firefly{position:absolute;z-index:0;pointer-events:none;width:4px;height:4px;border-radius:50%;background:var(--pet-lemon);box-shadow:0 0 6px var(--pet-lemon),0 0 12px rgba(248,240,128,0.3);animation:td-fireflyDrift 10s ease-in-out infinite}
@keyframes td-fireflyDrift{0%{opacity:0;transform:translate(0,0)}15%{opacity:0.6}30%{transform:translate(15px,-20px);opacity:0.8}50%{opacity:0.3;transform:translate(-10px,-35px)}70%{opacity:0.7;transform:translate(20px,-15px)}85%{opacity:0.4}100%{opacity:0;transform:translate(0,0)}}

/* Paw print particles (phase 1 only) */
.td-pawprint{position:absolute;z-index:0;pointer-events:none;opacity:0.08;animation:td-pawFloat 12s ease-in-out infinite}
.td-pawprint::before{content:'';display:block;width:10px;height:8px;background:#8a6a40;border-radius:50% 50% 30% 30%}
@keyframes td-pawFloat{0%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(10px,-15px) rotate(20deg)}100%{transform:translate(0,0) rotate(0deg)}}

/* Winner phase — golden meadow */
.td-shell.td-winner::before{background:
  linear-gradient(180deg, #f5efe0 0%, #e8dcc8 30%, var(--pet-warm-white) 100%)}
.td-shell.td-winner{border-color:#b8860b;box-shadow:0 6px 30px rgba(184,134,11,0.35),0 2px 8px rgba(184,134,11,0.15)}

/* Headers */
.td-h1{font-family:'Bebas Neue',Impact,sans-serif;font-size:2rem;text-align:center;letter-spacing:4px;text-transform:uppercase;
  color:var(--td-orange);text-shadow:2px 2px 0 rgba(92,61,46,0.15);margin:0 0 12px 0;font-weight:400}
.td-h2{font-family:'Bebas Neue',Impact,sans-serif;font-size:1.3rem;letter-spacing:3px;color:var(--td-orange);margin:14px 0 8px 0;text-transform:uppercase;font-weight:400}
.td-h3{font-family:'Inter',sans-serif;font-size:0.95rem;color:var(--pet-text);margin:10px 0 6px 0;letter-spacing:1px;font-weight:700}

/* Player card — rugged competitor badge */
.td-poster{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f5efe0,#e8dcc8);border:2px solid var(--pet-mint);border-radius:4px;padding:3px 14px 3px 3px;margin:3px;position:relative;overflow:hidden;transition:border-color 0.3s,box-shadow 0.3s;box-shadow:0 2px 6px rgba(92,61,46,0.1)}
.td-poster.td-high{border-color:var(--pet-mint);box-shadow:0 2px 8px rgba(90,154,72,0.2)}
.td-poster.td-mid{border-color:var(--pet-peach);box-shadow:0 2px 8px rgba(200,160,96,0.15)}
.td-poster.td-low{border-color:var(--pet-danger);box-shadow:0 2px 8px rgba(204,48,48,0.12)}
.td-poster.td-winner-p{border-color:#b8860b;box-shadow:0 0 14px rgba(184,134,11,0.35)}
.td-poster-frame{width:38px;height:38px;border-radius:4px;overflow:hidden;flex-shrink:0;border:2.5px solid var(--td-bark);position:relative;background:linear-gradient(135deg,rgba(92,61,46,0.05),rgba(200,180,140,0.1))}
.td-poster-frame img{width:100%;height:100%;object-fit:contain;display:block}
.td-poster-name{font-size:0.82rem;font-weight:700;color:var(--pet-text);white-space:nowrap;font-family:'Inter',sans-serif;text-transform:uppercase;letter-spacing:0.5px}
.td-poster-tag{font-size:0.65rem;font-family:'Inter',sans-serif;font-weight:700;padding:1px 6px;border-radius:3px;margin-left:4px;letter-spacing:0.5px}

/* Cards — rugged competition cards */
.td-card{background:linear-gradient(135deg,#f5efe0,#ede4d0);border:1.5px solid rgba(92,61,46,0.2);border-radius:4px;padding:10px 14px;margin:6px 0;color:var(--pet-text);font-size:0.88rem;line-height:1.5;position:relative;box-shadow:0 2px 6px rgba(92,61,46,0.08)}
.td-card.td-social{border:1.5px dashed rgba(92,61,46,0.3);background:linear-gradient(135deg,rgba(200,180,140,0.1),rgba(232,220,200,0.15))}
.td-card.td-mole-card{border:1.5px dashed var(--pet-danger);background:linear-gradient(135deg,rgba(204,48,48,0.05),rgba(200,180,140,0.05))}
.td-card.td-success-card{border:1.5px solid rgba(58,138,42,0.4);background:linear-gradient(135deg,rgba(58,138,42,0.06),rgba(90,154,72,0.08))}
.td-card.td-fail-card{border:1.5px solid rgba(204,48,48,0.3);background:linear-gradient(135deg,rgba(204,48,48,0.04),rgba(200,180,140,0.04))}
.td-card.td-winner-card{border:2.5px solid rgba(184,134,11,0.5);background:linear-gradient(135deg,rgba(184,134,11,0.06),rgba(212,160,23,0.08))}
.td-card.td-forest-card{background:linear-gradient(135deg,rgba(240,232,208,0.9),rgba(90,154,72,0.06));border-color:rgba(45,90,30,0.3)}

/* ═══ ANIMATED ICONS (CSS-only, animal-themed) ═══ */
.td-icon{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-right:8px;vertical-align:middle;flex-shrink:0;position:relative}

/* Paw — bouncing paw print */
.td-icon-paw::before{content:'';width:12px;height:10px;background:#8a6a40;border-radius:50% 50% 30% 30%;animation:td-pawBounce 1.2s ease infinite}
.td-icon-paw::after{content:'';position:absolute;top:0;width:14px;height:5px;
  background:radial-gradient(circle 2.5px at 20% 50%,#8a6a40,transparent 60%),
  radial-gradient(circle 2.5px at 50% 30%,#8a6a40,transparent 60%),
  radial-gradient(circle 2.5px at 80% 50%,#8a6a40,transparent 60%)}
@keyframes td-pawBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}

/* Bone — rotating */
.td-icon-bone::before{content:'';width:14px;height:5px;background:var(--pet-peach);border-radius:2px;animation:td-boneRot 2s ease-in-out infinite alternate}
.td-icon-bone::after{content:'';position:absolute;width:14px;height:5px;
  background:
    radial-gradient(circle 3.5px at 1px 50%,var(--pet-peach),transparent 60%),
    radial-gradient(circle 3.5px at 13px 50%,var(--pet-peach),transparent 60%)}
@keyframes td-boneRot{0%{transform:rotate(-15deg)}100%{transform:rotate(15deg)}}

/* Leaf — swaying */
.td-icon-leaf::before{content:'';width:10px;height:14px;background:var(--pet-grass);border-radius:2px 50% 2px 50%;animation:td-leafSway 2s ease-in-out infinite alternate}
.td-icon-leaf::after{content:'';position:absolute;width:1px;height:8px;background:var(--pet-green);top:4px;left:6px;border-radius:1px}
@keyframes td-leafSway{0%{transform:rotate(-8deg)}100%{transform:rotate(8deg)}}

/* Heart — soft beating */
.td-icon-heart::before{content:'';width:14px;height:13px;background:var(--pet-hot-pink);clip-path:polygon(50% 100%,0% 35%,0% 15%,25% 0%,50% 15%,75% 0%,100% 15%,100% 35%);animation:td-heartbeat 1s ease infinite}
@keyframes td-heartbeat{0%,100%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}45%{transform:scale(1.1)}}

/* Star — spinning gold */
.td-icon-star::before{content:'';width:14px;height:14px;background:#e8c050;clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);animation:td-starSpin 2.5s linear infinite}
@keyframes td-starSpin{to{transform:rotate(360deg)}}

/* Fishbone — for failures */
.td-icon-fishbone::before{content:'';width:14px;height:3px;background:var(--pet-muted);border-radius:1px}
.td-icon-fishbone::after{content:'';position:absolute;width:10px;height:12px;
  background:
    linear-gradient(45deg, transparent 46%, var(--pet-muted) 46%, var(--pet-muted) 50%, transparent 50%) 0 0/5px 4px,
    linear-gradient(-45deg, transparent 46%, var(--pet-muted) 46%, var(--pet-muted) 50%, transparent 50%) 0 0/5px 4px;
  background-repeat:repeat-y;opacity:0.7}

/* Feather — floating */
.td-icon-feather::before{content:'';width:6px;height:14px;background:var(--pet-sky);border-radius:50% 50% 30% 10%;animation:td-featherFloat 2.5s ease-in-out infinite alternate;transform-origin:bottom center}
.td-icon-feather::after{content:'';position:absolute;width:1px;height:10px;background:var(--pet-brown);opacity:0.3;top:2px;left:4px}
@keyframes td-featherFloat{0%{transform:rotate(-10deg) translateY(0)}100%{transform:rotate(10deg) translateY(-2px)}}

/* Droplet — for water events */
.td-icon-droplet::before{content:'';width:10px;height:12px;background:var(--pet-sky);border-radius:50% 50% 50% 50%/30% 30% 60% 60%;animation:td-dropBounce 1.5s ease infinite}
@keyframes td-dropBounce{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-2px) scaleY(1.1)}}

/* Flower — blooming */
.td-icon-flower::before{content:'';width:14px;height:14px;
  background:
    radial-gradient(circle 3px at 50% 50%, #f0c860, transparent),
    radial-gradient(circle 3px at 50% 20%, var(--pet-pink), transparent),
    radial-gradient(circle 3px at 80% 40%, var(--pet-pink), transparent),
    radial-gradient(circle 3px at 70% 75%, var(--pet-pink), transparent),
    radial-gradient(circle 3px at 30% 75%, var(--pet-pink), transparent),
    radial-gradient(circle 3px at 20% 40%, var(--pet-pink), transparent);
  animation:td-bloom 2s ease infinite}
@keyframes td-bloom{0%,100%{transform:scale(1)}50%{transform:scale(1.15) rotate(15deg)}}

/* Thorn — for negative events */
.td-icon-thorn::before{content:'';width:10px;height:12px;background:var(--pet-danger);clip-path:polygon(50% 0%,65% 35%,100% 50%,65% 65%,50% 100%,35% 65%,0% 50%,35% 35%);animation:td-thornPulse 1.5s ease infinite}
@keyframes td-thornPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:0.7}}

/* Eye — cute big blinking */
.td-icon-eye::before{content:'';width:16px;height:12px;border:2px solid var(--pet-lavender);border-radius:50%;animation:td-blink 3s ease infinite}
.td-icon-eye::after{content:'';position:absolute;width:6px;height:6px;background:var(--pet-lavender);border-radius:50%;animation:td-blink 3s ease infinite}
@keyframes td-blink{0%,42%,46%,100%{transform:scaleY(1)}44%{transform:scaleY(0.1)}}

/* Bell — jingling */
.td-icon-bell::before{content:'';width:12px;height:10px;background:var(--pet-peach);border-radius:50% 50% 10% 10%;animation:td-bellJingle 1s ease infinite alternate}
.td-icon-bell::after{content:'';position:absolute;width:4px;height:4px;background:var(--pet-brown);border-radius:50%;bottom:0}
@keyframes td-bellJingle{0%{transform:rotate(-8deg)}100%{transform:rotate(8deg)}}

/* Ribbon — flowing */
.td-icon-ribbon::before{content:'';width:14px;height:8px;background:linear-gradient(90deg,var(--pet-pink),var(--pet-lavender));border-radius:0 6px 6px 0;animation:td-ribbonFlow 1.5s ease infinite alternate}
@keyframes td-ribbonFlow{0%{transform:scaleX(1) skewY(0deg)}100%{transform:scaleX(1.1) skewY(3deg)}}

/* Paw trail — 3 dots animating in sequence */
.td-icon-pawtrail::before{content:'';width:18px;height:6px;
  background:
    radial-gradient(circle 2.5px at 3px 3px, var(--pet-mint), transparent 60%),
    radial-gradient(circle 2.5px at 9px 3px, var(--pet-mint), transparent 60%),
    radial-gradient(circle 2.5px at 15px 3px, var(--pet-mint), transparent 60%);
  animation:td-trailBounce 1.2s ease infinite}
@keyframes td-trailBounce{0%,100%{transform:translateY(0)}33%{transform:translateY(-2px)}66%{transform:translateY(1px)}}

/* Cage — for trap events */
.td-icon-cage::before{content:'';width:14px;height:12px;border:2px solid var(--pet-muted);border-radius:2px 2px 0 0;
  background:repeating-linear-gradient(90deg, transparent, transparent 2px, var(--pet-muted) 2px, var(--pet-muted) 3px)}
.td-icon-cage::after{content:'';position:absolute;width:14px;height:2px;background:var(--pet-muted);bottom:0;border-radius:1px}

@media(prefers-reduced-motion:reduce){
  .td-icon-paw::before,.td-icon-bone::before,.td-icon-leaf::before,
  .td-icon-heart::before,.td-icon-star::before,.td-icon-feather::before,
  .td-icon-droplet::before,.td-icon-flower::before,.td-icon-thorn::before,
  .td-icon-eye::before,.td-icon-eye::after,.td-icon-bell::before,
  .td-icon-ribbon::before,.td-icon-pawtrail::before{animation:none!important}
}

/* Progress bar */
.td-bar-wrap{height:8px;background:rgba(92,61,46,0.1);border-radius:3px;overflow:hidden;margin:4px 0}
.td-bar{height:100%;border-radius:3px;transition:width 0.4s ease}
.td-bar.td-gold{background:linear-gradient(90deg,#b8860b,#d4a017)}
.td-bar.td-green{background:linear-gradient(90deg,#3a8a2a,#5a9a48)}
.td-bar.td-crimson{background:linear-gradient(90deg,#cc3030,#e04040)}
.td-bar.td-amber{background:linear-gradient(90deg,#c8a060,#d4b070)}

/* ═══ MOOD METER (Combination: bar + face) ═══ */
.td-mood-wrap{display:inline-flex;align-items:center;gap:5px;margin:2px 0;vertical-align:middle}
.td-mood-bar-bg{width:50px;height:6px;background:rgba(92,61,46,0.12);border-radius:3px;overflow:hidden;flex-shrink:0}
.td-mood-bar{height:100%;border-radius:3px;transition:width 0.4s ease}
.td-mood-bar.td-mood-high{background:linear-gradient(90deg,#3a8a2a,#5aba38)}
.td-mood-bar.td-mood-mid{background:linear-gradient(90deg,#c8a060,#d4b070)}
.td-mood-bar.td-mood-low{background:linear-gradient(90deg,#cc3030,#e04040)}
.td-mood-label{font-family:'Inter',sans-serif;font-size:0.6rem;font-weight:700;color:var(--pet-muted);letter-spacing:0.3px;text-transform:uppercase}

/* Animal face expressions (CSS-only) */
.td-mood-face{width:16px;height:16px;border-radius:50%;position:relative;flex-shrink:0;border:1.5px solid rgba(92,61,46,0.3);background:var(--pet-cream)}

/* Eyes — two dots */
.td-mood-face::before{content:'';position:absolute;top:4px;left:3px;width:3px;height:3px;border-radius:50%;background:var(--pet-brown);box-shadow:6px 0 0 var(--pet-brown)}

/* Mouth — bottom pseudo */
.td-mood-face::after{content:'';position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:6px;height:3px;border-radius:0 0 50% 50%;background:transparent;border-bottom:1.5px solid var(--pet-brown)}

/* Ecstatic — big smile + bouncing */
.td-face-ecstatic{border-color:#3a8a2a;animation:td-faceBounce 0.6s ease infinite alternate}
.td-face-ecstatic::before{top:3px;height:2px;box-shadow:6px 0 0 var(--pet-brown)}
.td-face-ecstatic::after{width:8px;height:4px;border-bottom:2px solid #3a8a2a}
@keyframes td-faceBounce{0%{transform:scale(1)}100%{transform:scale(1.1)}}

/* Happy — smile */
.td-face-happy{border-color:var(--pet-mint)}
.td-face-happy::after{border-bottom-color:var(--pet-mint)}

/* Neutral — flat mouth */
.td-face-neutral::after{height:0;width:5px;border-bottom:1.5px solid var(--pet-muted);border-radius:0}

/* Unhappy — frown */
.td-face-unhappy{border-color:var(--pet-peach)}
.td-face-unhappy::after{bottom:2px;border-bottom:none;border-top:1.5px solid var(--pet-peach);border-radius:50% 50% 0 0;height:3px}

/* Furious — angry brows + frown + shaking */
.td-face-furious{border-color:var(--pet-danger);animation:td-faceShake 0.15s ease infinite}
.td-face-furious::before{top:3px;width:4px;height:2px;border-radius:0;background:var(--pet-danger);box-shadow:5px 0 0 var(--pet-danger);transform:rotate(-10deg)}
.td-face-furious::after{bottom:2px;border-bottom:none;border-top:2px solid var(--pet-danger);border-radius:50% 50% 0 0;height:3px}
@keyframes td-faceShake{0%{transform:translateX(-1px)}50%{transform:translateX(1px)}100%{transform:translateX(-1px)}}

/* Forest-phase mood colors */
.td-shell.td-forest .td-mood-bar-bg{background:rgba(240,232,208,0.1)}
.td-shell.td-forest .td-mood-label{color:rgba(176,200,144,0.7)}
.td-shell.td-forest .td-mood-face{background:rgba(240,232,208,0.15);border-color:rgba(176,200,144,0.4)}
.td-shell.td-forest .td-mood-face::before{background:#b0c890;box-shadow:6px 0 0 #b0c890}
.td-shell.td-forest .td-mood-face::after{border-bottom-color:#b0c890}
.td-shell.td-forest .td-face-neutral::after{border-bottom-color:rgba(176,200,144,0.5)}
.td-shell.td-forest .td-face-unhappy::after{border-top-color:var(--pet-peach);border-bottom:none}
.td-shell.td-forest .td-face-furious::before{background:var(--pet-danger);box-shadow:5px 0 0 var(--pet-danger)}
.td-shell.td-forest .td-face-furious::after{border-top-color:var(--pet-danger);border-bottom:none}

/* Refusal card */
.td-card.td-refusal-card{border:2px dashed var(--pet-danger);background:linear-gradient(135deg,rgba(204,48,48,0.06),rgba(200,180,140,0.04));position:relative}
.td-card.td-refusal-card::before{content:'REFUSED';position:absolute;top:4px;right:8px;font-family:'Bebas Neue',Impact,sans-serif;font-size:0.65rem;letter-spacing:2px;color:var(--pet-danger);opacity:0.7}

/* Unique trigger card */
.td-card.td-trigger-card{border:1.5px solid var(--pet-peach);background:linear-gradient(135deg,rgba(200,160,96,0.08),rgba(232,220,200,0.06));position:relative}
.td-card.td-trigger-card::before{content:'MOOD MOMENT';position:absolute;top:4px;right:8px;font-family:'Bebas Neue',Impact,sans-serif;font-size:0.55rem;letter-spacing:2px;color:var(--pet-peach);opacity:0.7}

/* Reveal controls (Layer 8) */
.td-reveal-bar{display:flex;gap:8px;align-items:center;justify-content:center;padding:10px 20px;flex-wrap:wrap;position:sticky;bottom:0;z-index:100;background:linear-gradient(90deg,rgba(92,61,46,0.95),rgba(72,48,32,0.98));backdrop-filter:blur(8px);border-top:3px solid var(--td-orange);border-radius:0;box-shadow:0 -4px 20px rgba(0,0,0,0.2);max-width:100%;width:100%}
.td-btn{font-family:'Bebas Neue',Impact,sans-serif;font-size:0.9rem;font-weight:400;padding:6px 20px;border:2px solid var(--td-orange);border-radius:3px;background:rgba(232,120,48,0.15);color:var(--td-orange);cursor:pointer;letter-spacing:2px;transition:all 0.2s;text-transform:uppercase;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
.td-btn:hover{background:rgba(232,120,48,0.3);border-color:#ff8830;box-shadow:0 2px 8px rgba(232,120,48,0.3);color:#ff8830}
.td-btn.td-btn-reveal-all{border-color:rgba(232,220,200,0.3);background:rgba(232,220,200,0.08);color:rgba(232,220,200,0.7)}
.td-btn.td-btn-reveal-all:hover{background:rgba(232,220,200,0.15);border-color:rgba(232,220,200,0.5);color:rgba(232,220,200,0.9)}

/* Step visibility */
.td-step{transition:opacity 0.3s ease}
.td-step.td-visible{opacity:1}

/* Host line */
.td-host{font-style:italic;color:var(--pet-brown);margin:8px 0;padding:8px 12px;border-left:3px solid var(--td-orange);background:linear-gradient(90deg,rgba(232,120,48,0.06),transparent);font-size:0.88rem;border-radius:0 3px 3px 0}

/* Sidebar */
.td-sb-title{font-family:'Bebas Neue',Impact,sans-serif;font-size:0.85rem;letter-spacing:3px;color:var(--td-orange);text-transform:uppercase;margin:0 0 6px 0;padding-bottom:4px;border-bottom:2px solid rgba(232,120,48,0.25);font-weight:400}
.td-sb-section{margin:10px 0}
.td-sb-row{display:flex;align-items:center;gap:5px;margin:3px 0;font-size:0.78rem}
.td-sb-row img{width:22px;height:22px;border-radius:3px;object-fit:contain;flex-shrink:0;border:1.5px solid var(--td-bark)}
.td-sb-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--pet-text)}
.td-sb-tag{font-family:'Inter',sans-serif;font-size:0.6rem;font-weight:700;padding:1px 5px;border-radius:2px;white-space:nowrap;letter-spacing:0.5px;text-transform:uppercase}
.td-sb-tag.td-gold{background:rgba(184,134,11,0.15);color:#8a6a00}
.td-sb-tag.td-green{background:rgba(58,138,42,0.15);color:#2d5a1e}
.td-sb-tag.td-crimson{background:rgba(204,48,48,0.12);color:#aa2020}
.td-sb-tag.td-amber{background:rgba(200,160,96,0.2);color:#8a6a30}
.td-sb-tag.td-grey{background:rgba(122,106,90,0.1);color:var(--pet-muted)}
.td-sb-tag.td-brass{background:rgba(92,61,46,0.12);color:var(--pet-brown)}
.td-sb-tag.td-crown{background:rgba(184,134,11,0.2);color:#8a6a00}
.td-sb-tag.td-pink{background:rgba(232,120,48,0.15);color:var(--td-orange)}

/* ═══ BROADCAST HUD (Layer 2a — channel bug + live badge) ═══ */
.td-hud{display:flex;align-items:center;gap:0;background:linear-gradient(90deg,rgba(42,26,10,0.95),rgba(72,48,32,0.92));padding:0;height:28px;font-family:'Inter',sans-serif;z-index:4;position:relative;border-bottom:2px solid var(--td-orange)}
.td-hud-live{display:inline-flex;align-items:center;gap:4px;background:#cc3030;color:#fff;font-size:0.6rem;font-weight:800;padding:2px 8px;letter-spacing:2px;text-transform:uppercase;height:100%}
.td-hud-live::before{content:'';width:6px;height:6px;border-radius:50%;background:#ff4040;animation:td-livePulse 1.2s ease infinite}
@keyframes td-livePulse{0%,100%{opacity:1;box-shadow:0 0 4px #ff4040}50%{opacity:0.4;box-shadow:0 0 8px #ff6060}}
.td-hud-title{flex:1;text-align:center;font-family:'Bebas Neue',Impact,sans-serif;font-size:0.85rem;color:var(--td-orange);letter-spacing:4px;text-transform:uppercase}
.td-hud-phase{font-size:0.6rem;font-weight:700;color:rgba(232,220,200,0.6);padding:0 10px;letter-spacing:1px;text-transform:uppercase;white-space:nowrap}
.td-shell.td-forest .td-hud{background:linear-gradient(90deg,rgba(21,42,10,0.95),rgba(30,56,16,0.92));border-bottom-color:#5a9a38}
.td-shell.td-forest .td-hud-title{color:#8ac050}
.td-shell.td-forest .td-hud-phase{color:rgba(138,192,80,0.6)}
.td-shell.td-winner .td-hud{border-bottom-color:#b8860b}
.td-shell.td-winner .td-hud-title{color:#d4a017}

/* ═══ NEWS TICKER (Layer 7 — animal-themed scroll) ═══ */
.td-ticker{background:linear-gradient(90deg,rgba(42,26,10,0.92),rgba(72,48,32,0.88));height:22px;overflow:hidden;position:relative;border-top:1.5px solid rgba(232,120,48,0.3);z-index:4}
.td-ticker-label{position:absolute;left:0;top:0;height:100%;display:flex;align-items:center;padding:0 8px;background:var(--td-orange);color:#2a1a0a;font-family:'Bebas Neue',Impact,sans-serif;font-size:0.65rem;letter-spacing:2px;z-index:1;font-weight:400}
.td-ticker-scroll{display:flex;align-items:center;height:100%;animation:td-tickerScroll 35s linear infinite;white-space:nowrap;padding-left:80px}
.td-ticker-scroll span{font-family:'Inter',sans-serif;font-size:0.62rem;color:rgba(232,220,200,0.7);padding:0 20px;letter-spacing:0.3px}
.td-ticker-scroll span::before{content:'◆ ';color:var(--td-orange);font-size:0.5rem}
@keyframes td-tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.td-shell.td-forest .td-ticker{background:linear-gradient(90deg,rgba(21,42,10,0.92),rgba(30,56,16,0.88));border-top-color:rgba(90,154,56,0.3)}
.td-shell.td-forest .td-ticker-label{background:#5a9a38}
.td-shell.td-forest .td-ticker-scroll span{color:rgba(200,216,176,0.7)}
.td-shell.td-forest .td-ticker-scroll span::before{color:#8ac050}

/* ═══ CONFESSIONAL CARD (Layer — reality TV drama) ═══ */
.td-confessional{background:linear-gradient(135deg,rgba(42,26,10,0.08),rgba(92,61,46,0.04));border:1.5px solid rgba(92,61,46,0.25);border-radius:4px;padding:10px 14px 10px 50px;margin:8px 0;font-size:0.84rem;line-height:1.5;position:relative;font-style:italic;color:var(--pet-brown)}
.td-confessional::before{content:'CONFESSIONAL';position:absolute;top:4px;left:6px;font-family:'Bebas Neue',Impact,sans-serif;font-size:0.5rem;letter-spacing:2px;color:var(--pet-muted);writing-mode:vertical-lr;text-orientation:mixed;transform:rotate(180deg);opacity:0.6}
.td-confessional .td-conf-portrait{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:3px;border:2px solid var(--td-bark);overflow:hidden}
.td-confessional .td-conf-portrait img{width:100%;height:100%;object-fit:contain}
.td-shell.td-forest .td-confessional{background:linear-gradient(135deg,rgba(90,154,56,0.06),rgba(30,56,16,0.04));border-color:rgba(90,154,56,0.3);color:#b0c890}

/* ═══ OVERDRIVE: Treat Counter Bar (Layer 2b) ═══ */
.td-treat-bar{font-family:'Inter',sans-serif;font-size:0.72rem;color:var(--pet-brown);background:linear-gradient(90deg,rgba(92,61,46,0.08),rgba(245,239,224,0.6),rgba(92,61,46,0.08));border-bottom:2px solid rgba(92,61,46,0.2);padding:5px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;z-index:2;position:relative;letter-spacing:0.5px}
.td-treat-label{flex:1;text-align:center;white-space:nowrap;letter-spacing:3px;color:var(--td-orange);font-weight:800;text-transform:uppercase;font-family:'Bebas Neue',Impact,sans-serif;font-size:0.85rem}
.td-treat-sub{white-space:nowrap;color:var(--pet-muted);font-size:0.65rem;font-weight:600}
.td-treat-dots{display:flex;gap:3px;align-items:center;flex-wrap:wrap}
.td-treat-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.td-treat-dot.td-compat-high{background:var(--pet-mint)}
.td-treat-dot.td-compat-mid{background:var(--pet-peach)}
.td-treat-dot.td-compat-low{background:var(--pet-danger)}
.td-shell.td-forest .td-treat-bar{background:linear-gradient(90deg,rgba(30,56,16,0.3),rgba(45,90,30,0.15),rgba(30,56,16,0.3));border-bottom-color:rgba(90,154,56,0.3);color:#c8d8b0}
.td-shell.td-forest .td-treat-label{color:#8ac050}
.td-shell.td-forest .td-treat-sub{color:#8aa870}

/* ═══ OVERDRIVE: Animal Whispers (Layer 3) ═══ */
.td-whisper{font-style:italic;font-size:0.72rem;color:var(--pet-muted);border-left:2px dashed rgba(92,61,46,0.3);padding:5px 10px;margin:6px 0 6px 12px;line-height:1.4;font-family:'Inter',sans-serif;background:linear-gradient(90deg,rgba(92,61,46,0.03),transparent);border-radius:0 3px 3px 0}
.td-shell.td-forest .td-whisper{border-left-color:rgba(90,154,56,0.4);background:linear-gradient(90deg,rgba(90,154,56,0.04),transparent);color:#8aa870}

/* ═══ VIEWPORT WINDOW (sidebar environmental scene) ═══ */
.td-viewport{width:100%;height:60px;border-radius:3px;overflow:hidden;position:relative;margin:6px 0;border:2px solid rgba(92,61,46,0.3);background:#8aaa60}
/* Indoor phase — barn/shack interior */
.td-vp-barn{background:linear-gradient(180deg,#6a5a40 0%,#7a6a50 30%,#8a7a60 60%,#9a8a70 100%);position:relative}
.td-vp-barn::before{content:'';position:absolute;bottom:0;left:0;right:0;height:20px;background:repeating-linear-gradient(90deg,#8a7a60 0px,#8a7a60 8px,#7a6a50 8px,#7a6a50 10px);border-top:2px solid rgba(0,0,0,0.1)}
.td-vp-barn::after{content:'';position:absolute;top:8px;left:50%;transform:translateX(-50%);width:20px;height:16px;border:2px solid rgba(200,180,140,0.4);border-radius:2px;background:rgba(200,200,255,0.15)}
/* Forest phase — trees + sky */
.td-vp-forest{background:linear-gradient(180deg,#2a4a18 0%,#3a5a20 40%,#4a6a28 100%);position:relative}
.td-vp-forest::before{content:'';position:absolute;bottom:0;left:0;right:0;height:12px;background:#2a3a14}
.td-vp-tree{position:absolute;bottom:12px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:20px solid #1e3a10}
.td-vp-tree::after{content:'';position:absolute;top:18px;left:-2px;width:4px;height:8px;background:#5a4a30;border-radius:1px}
/* Meadow — winner */
.td-vp-meadow{background:linear-gradient(180deg,#7ab0d0 0%,#8ac0e0 30%,#90c868 60%,#80b858 100%);position:relative}
.td-vp-meadow::before{content:'';position:absolute;top:10px;left:30%;width:24px;height:12px;background:rgba(255,255,255,0.6);border-radius:50%;animation:td-cloudDrift 8s ease-in-out infinite alternate}
@keyframes td-cloudDrift{0%{transform:translateX(0)}100%{transform:translateX(30px)}}

/* ═══ OVERDRIVE: Zone Transition (Layer 4) ═══ */
.td-transition{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;pointer-events:none}
.td-transition.td-trans-shop-open{background:linear-gradient(180deg,rgba(92,61,46,0.9),rgba(232,220,200,0.95));animation:td-shopOpen 2s ease-out forwards}
@keyframes td-shopOpen{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-100%);visibility:hidden}}
.td-transition.td-trans-forest-enter{background:linear-gradient(180deg,rgba(30,56,16,0.9),rgba(45,74,24,0.85));animation:td-forestFadeIn 2.5s ease-out forwards}
.td-trans-forest-text{font-family:'Bebas Neue',Impact,sans-serif;font-size:2rem;font-weight:400;color:#c8d8a0;letter-spacing:6px;text-shadow:2px 2px 0 rgba(0,0,0,0.3)}
@keyframes td-forestFadeIn{0%{opacity:1}70%{opacity:0.6}100%{opacity:0;visibility:hidden}}
.td-transition.td-trans-winner-burst{background:radial-gradient(circle,rgba(184,134,11,0.6),transparent 70%);animation:td-winnerBurst 2s ease-out forwards}
@keyframes td-winnerBurst{0%{opacity:1;transform:scale(0.5)}40%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(2);visibility:hidden}}

/* ═══ OVERDRIVE: Card Physics (Layer 6) ═══ */
/* Phase 1: gentle toy bounce */
.td-shell:not(.td-forest):not(.td-winner) .td-card{animation:td-cardBounce 3.5s ease-in-out infinite}
.td-shell:not(.td-forest):not(.td-winner) .td-card:nth-child(2n){animation-delay:0.4s;animation-duration:3.8s}
.td-shell:not(.td-forest):not(.td-winner) .td-card:nth-child(3n){animation-delay:0.9s;animation-duration:3.2s}
@keyframes td-cardBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}

/* Scorecard pop for judging */
.td-scoreflip{animation:td-scorePop 0.5s ease-out forwards}
@keyframes td-scorePop{0%{transform:scale(0.8) rotate(-2deg);opacity:0}60%{transform:scale(1.06) rotate(0.5deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}

/* Phase 2: tree branch sway */
.td-shell.td-forest .td-card{animation:td-cardSway 3.5s ease-in-out infinite}
.td-shell.td-forest .td-card:nth-child(2n){animation-delay:0.3s;animation-duration:3.8s}
.td-shell.td-forest .td-card:nth-child(3n){animation-delay:0.7s;animation-duration:3.1s}
@keyframes td-cardSway{0%,100%{transform:translateX(0) rotate(0deg)}50%{transform:translateX(1.5px) rotate(0.3deg)}}

.td-step .td-card{animation-play-state:running}

/* Leaderboard */
.td-lb-row{display:flex;align-items:center;gap:6px;padding:5px 8px;margin:3px 0;border-radius:3px;font-size:0.85rem;background:rgba(92,61,46,0.04)}
.td-lb-row.td-first{background:rgba(184,134,11,0.08);border:2px solid rgba(184,134,11,0.35)}
.td-lb-rank{font-family:'Bebas Neue',Impact,sans-serif;width:24px;text-align:center;color:var(--td-orange);font-weight:400;font-size:1rem}
.td-lb-name{flex:1;color:var(--pet-text);font-weight:600}
.td-lb-score{font-family:'Inter',sans-serif;color:var(--pet-brown);font-size:0.8rem;font-weight:700}

/* Trail progress (sidebar) — paw step tracker */
.td-trail{display:flex;flex-direction:column;gap:1px;margin:6px 0}
.td-trail-seg{min-height:20px;display:flex;align-items:center;gap:3px;padding:1px 6px;border-radius:2px;font-size:0.55rem;font-family:'Inter',sans-serif;font-weight:600;color:var(--pet-muted);background:rgba(92,61,46,0.05);border:1px solid rgba(92,61,46,0.12);position:relative}
.td-trail-seg.td-reached{background:rgba(58,138,42,0.1);border-color:rgba(58,138,42,0.3)}
.td-trail-seg.td-finish{background:rgba(184,134,11,0.1);border-color:rgba(184,134,11,0.3)}
.td-trail-dot{width:16px;height:16px;border-radius:3px;border:1.5px solid var(--td-bone);overflow:hidden;flex-shrink:0}
.td-trail-dot img{width:100%;height:100%;object-fit:contain;display:block}
.td-trail-icons{display:flex;gap:2px;align-items:center;margin-left:auto}

/* Compat bar in sidebar */
.td-compat-bar{height:6px;border-radius:2px;background:rgba(92,61,46,0.08);overflow:hidden;margin:2px 0 0 27px}
.td-compat-fill{height:100%;border-radius:2px}

/* ═══ Sidebar animated pet (replaces viewport/map) ═══ */
.td-sb-pet{width:60px;height:60px;margin:0 auto 8px;position:relative}
.td-sb-pet-cat{position:absolute;width:30px;height:24px;left:4px;top:10px;animation:td-sbCatStretch 4s ease-in-out infinite}
.td-sb-pet-cat::before{content:'';position:absolute;width:20px;height:16px;background:#a08060;border-radius:50%;top:5px;left:3px}
.td-sb-pet-cat::after{content:'';position:absolute;width:10px;height:10px;background:#a08060;border-radius:50%;top:0;left:7px}
@keyframes td-sbCatStretch{0%,100%{transform:scaleX(1) translateY(0)}30%{transform:scaleX(1.15) translateY(-2px)}60%{transform:scaleX(0.95) translateY(1px)}}
.td-sb-pet-dog{position:absolute;width:28px;height:22px;right:2px;top:14px;animation:td-sbDogWag 2s ease-in-out infinite}
.td-sb-pet-dog::before{content:'';position:absolute;width:18px;height:14px;background:#8a6a40;border-radius:50% 60% 40% 50%;top:5px;left:2px}
.td-sb-pet-dog::after{content:'';position:absolute;width:8px;height:3px;background:#8a6a40;border-radius:3px;top:6px;right:0;transform-origin:left center;animation:td-sbDogTail 0.3s ease-in-out infinite alternate}
@keyframes td-sbDogWag{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes td-sbDogTail{0%{transform:rotate(-25deg)}100%{transform:rotate(25deg)}}

/* Forest sidebar: bunny + bird */
.td-sb-pet-bunny{position:absolute;width:20px;height:18px;left:8px;top:16px;animation:td-sbBunnyHop 2.5s ease infinite}
.td-sb-pet-bunny::before{content:'';position:absolute;width:14px;height:12px;background:#b0a090;border-radius:50%;bottom:0;left:3px}
.td-sb-pet-bunny::after{content:'';position:absolute;width:6px;height:10px;background:#b0a090;border-radius:50% 50% 20% 20%;top:0;left:5px}
@keyframes td-sbBunnyHop{0%,100%{transform:translateY(0)}25%{transform:translateY(-10px)}50%{transform:translateY(0)}65%{transform:translateY(-4px)}}
.td-sb-pet-songbird{position:absolute;width:16px;height:14px;right:6px;top:6px;animation:td-sbBirdBob 3s ease-in-out infinite}
.td-sb-pet-songbird::before{content:'';position:absolute;width:12px;height:10px;background:#7a8a6a;border-radius:50%;top:3px;left:0}
.td-sb-pet-songbird::after{content:'';position:absolute;width:10px;height:3px;top:0;left:3px;
  background:linear-gradient(135deg,#7a8a6a 0%,transparent 45%),linear-gradient(225deg,#7a8a6a 0%,transparent 45%);
  animation:td-sbBirdWing 0.4s ease-in-out infinite alternate}
@keyframes td-sbBirdBob{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-4px) rotate(3deg)}}
@keyframes td-sbBirdWing{0%{transform:scaleY(1)}100%{transform:scaleY(-0.5)}}

/* ═══ OVERDRIVE: Score Slam (judging scores slam in) ═══ */
.td-scoreflip{animation:td-scoreSlamIn 0.4s cubic-bezier(0.18,0.89,0.32,1.28) both}
@keyframes td-scoreSlamIn{0%{transform:scale(2.5) rotate(-3deg);opacity:0;filter:blur(4px)}60%{transform:scale(0.95) rotate(1deg);opacity:1;filter:blur(0)}80%{transform:scale(1.05) rotate(-0.5deg)}100%{transform:scale(1) rotate(0deg)}}

/* ═══ OVERDRIVE: BREAKING Alert (lead change in forest) ═══ */
.td-breaking{background:linear-gradient(135deg,rgba(204,48,48,0.12),rgba(232,120,48,0.08));border:2px solid var(--pet-danger);border-radius:4px;padding:8px 14px;margin:8px 0;position:relative;animation:td-breakingFlash 0.6s ease 2}
.td-breaking::before{content:'LEAD CHANGE';position:absolute;top:-8px;left:12px;font-family:'Bebas Neue',Impact,sans-serif;font-size:0.65rem;letter-spacing:3px;color:#fff;background:var(--pet-danger);padding:1px 8px;border-radius:2px}
.td-breaking-text{font-family:'Inter',sans-serif;font-size:0.82rem;font-weight:700;color:var(--pet-text)}
.td-shell.td-forest .td-breaking{background:linear-gradient(135deg,rgba(204,48,48,0.15),rgba(232,120,48,0.1));border-color:#cc4040}
.td-shell.td-forest .td-breaking-text{color:#f0e8d8}
@keyframes td-breakingFlash{0%{box-shadow:0 0 0 rgba(204,48,48,0)}50%{box-shadow:0 0 20px rgba(204,48,48,0.4)}100%{box-shadow:0 0 0 rgba(204,48,48,0)}}

/* ═══ OVERDRIVE: Position Change Arrows ═══ */
.td-arrow-up{display:inline-block;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:6px solid #3a8a2a;margin:0 3px;vertical-align:middle;animation:td-arrowBounceUp 0.5s ease 2}
.td-arrow-down{display:inline-block;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:6px solid #cc3030;margin:0 3px;vertical-align:middle;animation:td-arrowBounceDown 0.5s ease 2}
.td-arrow-same{display:inline-block;width:6px;height:2px;background:var(--pet-muted);margin:0 3px;vertical-align:middle;border-radius:1px}
@keyframes td-arrowBounceUp{0%{transform:translateY(0)}50%{transform:translateY(-3px)}100%{transform:translateY(0)}}
@keyframes td-arrowBounceDown{0%{transform:translateY(0)}50%{transform:translateY(3px)}100%{transform:translateY(0)}}

/* ═══ OVERDRIVE: Tension Escalation (forest cards intensify) ═══ */
.td-tension-1 .td-card{border-left:3px solid rgba(90,154,72,0.4)}
.td-tension-2 .td-card{border-left:3px solid rgba(200,160,96,0.5)}
.td-tension-3 .td-card{border-left:3px solid rgba(232,120,48,0.6);box-shadow:0 2px 8px rgba(232,120,48,0.1)}
.td-tension-4 .td-card{border-left:3px solid rgba(204,48,48,0.5);box-shadow:0 2px 12px rgba(204,48,48,0.12);animation:td-tensionPulse 2s ease-in-out infinite}
.td-tension-5 .td-card{border-left:4px solid rgba(204,48,48,0.7);box-shadow:0 2px 16px rgba(204,48,48,0.18);animation:td-tensionPulse 1.2s ease-in-out infinite}
@keyframes td-tensionPulse{0%,100%{box-shadow:0 2px 12px rgba(204,48,48,0.12)}50%{box-shadow:0 4px 20px rgba(204,48,48,0.25)}}

/* ═══ OVERDRIVE: Photo Finish ═══ */
.td-photo-finish{background:linear-gradient(135deg,rgba(184,134,11,0.12),rgba(232,192,80,0.08));border:2px solid #b8860b;border-radius:4px;padding:10px 14px;margin:10px 0;text-align:center;position:relative;animation:td-photoFlash 0.8s ease}
.td-photo-finish::before{content:'PHOTO FINISH';position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-family:'Bebas Neue',Impact,sans-serif;font-size:0.7rem;letter-spacing:3px;color:#fff;background:#b8860b;padding:1px 10px;border-radius:2px;white-space:nowrap}
.td-photo-finish-names{font-family:'Bebas Neue',Impact,sans-serif;font-size:1.2rem;color:#b8860b;letter-spacing:2px;margin:6px 0}
.td-photo-finish-gap{font-family:'Inter',sans-serif;font-size:0.75rem;color:var(--pet-muted);font-weight:700}
@keyframes td-photoFlash{0%{opacity:0;transform:scaleX(0.8)}30%{opacity:1;transform:scaleX(1.02)}100%{transform:scaleX(1)}}

/* ═══ OVERDRIVE: Judge Reaction Icons (CSS animated) ═══ */
.td-judge-react{display:inline-flex;align-items:center;gap:4px;margin:4px 0;font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted)}
.td-judge-icon{width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.6rem;flex-shrink:0;position:relative}
.td-judge-icon.td-judge-chris{background:linear-gradient(135deg,#5a9a48,#3a7a28);color:#fff;border:1.5px solid #2d5a1e}
.td-judge-icon.td-judge-chef{background:linear-gradient(135deg,#a08060,#7a5a30);color:#fff;border:1.5px solid #5c3d2e}
.td-judge-react-love{animation:td-judgeLove 0.5s ease 2}
.td-judge-react-meh{animation:td-judgeMeh 0.6s ease 1}
.td-judge-react-hate{animation:td-judgeHate 0.3s ease 3}
@keyframes td-judgeLove{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes td-judgeMeh{0%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}100%{transform:rotate(0)}}
@keyframes td-judgeHate{0%{transform:translateX(0)}25%{transform:translateX(-2px)}75%{transform:translateX(2px)}100%{transform:translateX(0)}}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .td-shell::before,.td-shell::after{animation:none!important}
  .td-h1,.td-butterfly,.td-pawprint,.td-transition{animation:none!important;transform:none!important}
  .td-anim-cat,.td-anim-dog,.td-anim-bunny,.td-anim-fish,.td-anim-bird,.td-firefly{animation:none!important;transform:none!important}
  .td-anim-dog::after,.td-anim-bird::after{animation:none!important}
  .td-sb-pet-cat,.td-sb-pet-dog,.td-sb-pet-bunny,.td-sb-pet-songbird{animation:none!important}
  .td-sb-pet-dog::after,.td-sb-pet-songbird::after{animation:none!important}
  .td-transition{opacity:0!important;visibility:hidden!important}
  .td-transition::before,.td-transition::after{animation:none!important}
  .td-step{transition:none!important;animation:none!important}
  .td-bar{transition:none!important}
  .td-card{animation:none!important;filter:none!important;opacity:1!important;transform:none!important}
  .td-scoreflip{animation:none!important;transform:none!important;opacity:1!important}
  .td-butterfly::before,.td-butterfly::after{animation:none!important}
  .td-pawprint{animation:none!important}
  .td-breaking{animation:none!important}
  .td-photo-finish{animation:none!important}
  .td-arrow-up,.td-arrow-down{animation:none!important}
  .td-judge-react-love,.td-judge-react-meh,.td-judge-react-hate{animation:none!important}
  .td-mood-face{animation:none!important}
}
</style>`;
}

// ══════════════════════════════════════════════════════════════
// PLAYER POSTER BUILDER
// ══════════════════════════════════════════════════════════════
function _poster(name, statusCls = '', tag = '') {
  const sl = slug(name);
  return `<span class="td-poster ${statusCls}">
    <span class="td-poster-frame"><img src="assets/avatars/${sl}.png" alt="${name}" onerror="this.style.display='none'"></span>
    <span class="td-poster-name">${name}</span>${tag ? `<span class="td-poster-tag ${tag.cls || ''}">${tag.text}</span>` : ''}
  </span>`;
}

// ══════════════════════════════════════════════════════════════
// SHELL WRAPPER
// ══════════════════════════════════════════════════════════════
function _buildTreatBar(phaseCls, ep) {
  if (!phaseCls) return '';
  const bar = TREAT_BAR_DATA[phaseCls] || TREAT_BAR_DATA[''];

  let dotsHtml = '';
  const data = ep.topDog;
  if (data?.phase1?.assignments) {
    data.phase1.assignments.forEach(a => {
      const cls = a.compatibility >= 6.5 ? 'td-compat-high' : a.compatibility >= 4 ? 'td-compat-mid' : 'td-compat-low';
      dotsHtml += `<span class="td-treat-dot ${cls}" title="${a.player}: ${a.compatibility.toFixed(1)}"></span>`;
    });
  }

  return `<div class="td-treat-bar">
    ${_icon(bar.icon)}
    <span class="td-treat-label">${bar.label}</span>
    <span class="td-treat-sub">${bar.sub}</span>
    <span class="td-treat-dots">${dotsHtml}</span>
  </div>`;
}

function _buildTransition(phaseCls) {
  if (phaseCls === 'td-petshop-assign' || phaseCls === 'td-petshop-training' || phaseCls === 'td-petshop-judging') {
    return `<div class="td-transition td-trans-shop-open">${_icon('paw')}${_icon('heart')}${_icon('paw')}</div>`;
  }
  if (phaseCls === 'td-forest') {
    return `<div class="td-transition td-trans-forest-enter"><span class="td-trans-forest-text">INTO THE WILD</span></div>`;
  }
  if (phaseCls === 'td-winner') {
    return `<div class="td-transition td-trans-winner-burst"></div>`;
  }
  return '';
}

function _buildAnimalParticles() {
  let html = '';
  const animalTypes = ['td-anim-cat', 'td-anim-dog', 'td-anim-bunny', 'td-anim-bird', 'td-anim-fish'];
  for (let i = 0; i < 8; i++) {
    const type = animalTypes[i % animalTypes.length];
    const left = 5 + Math.random() * 85;
    const top = 5 + Math.random() * 85;
    const delay = (Math.random() * 10).toFixed(1);
    const dur = (5 + Math.random() * 6).toFixed(1);
    html += `<div class="${type}" style="left:${left}%;top:${top}%;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
  }
  for (let i = 0; i < 6; i++) {
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = (Math.random() * 12).toFixed(1);
    const rot = Math.floor(Math.random() * 360);
    html += `<div class="td-pawprint" style="left:${left}%;top:${top}%;animation-delay:${delay}s;transform:rotate(${rot}deg)"></div>`;
  }
  return html;
}

function _buildForestParticles() {
  let html = '';
  const colors = ['var(--pet-pink)', 'var(--pet-lavender)', 'var(--pet-sky)', 'var(--pet-lemon)', 'var(--pet-bubblegum)'];
  for (let i = 0; i < 10; i++) {
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = (Math.random() * 8).toFixed(1);
    const dur = (6 + Math.random() * 6).toFixed(1);
    const color = colors[i % colors.length];
    html += `<div class="td-butterfly" style="left:${left}%;top:${top}%;animation-delay:${delay}s;animation-duration:${dur}s"><style>.td-butterfly:nth-child(${i + 1})::before,.td-butterfly:nth-child(${i + 1})::after{background:${color}}</style></div>`;
  }
  for (let i = 0; i < 6; i++) {
    const left = Math.random() * 100;
    const top = 20 + Math.random() * 70;
    const delay = (Math.random() * 10).toFixed(1);
    const dur = (8 + Math.random() * 8).toFixed(1);
    html += `<div class="td-firefly" style="left:${left}%;top:${top}%;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
  }
  return html;
}

function _buildHUD(phaseCls) {
  const bar = TREAT_BAR_DATA[phaseCls] || TREAT_BAR_DATA[''];
  return `<div class="td-hud">
    <div class="td-hud-live">LIVE</div>
    <div class="td-hud-title">TOP DOG</div>
    <div class="td-hud-phase">${bar.label}</div>
  </div>`;
}

function _buildTicker(phaseCls, ep) {
  const data = ep.topDog;
  const items = [];
  if (phaseCls === 'td-petshop-assign') {
    items.push('Priority draft underway — highest social + boldness picks first');
    items.push('12 animals available — danger ratings from 1 to 5');
    items.push('Compatibility determines training success rate');
    items.push('Chris McLean production — expect traps in the forest');
    items.push('Chef sighting near the scoring table — he does NOT look happy');
    items.push('Phase 2 head start awarded to top performer');
  } else if (phaseCls === 'td-petshop-training') {
    items.push('4 training rounds — success builds compatibility');
    items.push('Critical failures cost compatibility points');
    items.push('Mole may be sabotaging training stations');
    items.push('Training rate affects talent show performance');
    items.push('Animal temperament determines trick difficulty');
    items.push('Chef seen "taste-testing" the animal treats');
  } else if (phaseCls === 'td-petshop-judging') {
    items.push('Chris and Chef score each performance out of 10');
    items.push('Top scorer earns 3-segment head start in race');
    items.push('Standing ovation = +2 popularity boost');
    items.push('Catastrophe = -2 popularity and a lifetime of shame');
    items.push('Chef is in a BAD mood today — scores may be brutal');
    items.push('Animal mood affects performance quality');
  } else if (phaseCls === 'td-forest') {
    const positions = data?.phase2?.positions || {};
    const leader = Object.entries(positions).sort((a,b) => b[1]-a[1])[0];
    items.push('14 segments of dense forest between camp and the meadow');
    items.push('Traps, obstacles, and wrong turns await');
    items.push('First team to the meadow wins IMMUNITY');
    if (leader) items.push(`${leader[0]} currently in the lead at segment ${Math.floor(leader[1])}`);
    items.push('GPS advantage active — the mole knows the way');
    items.push('Animal instincts may find shortcuts... or dead ends');
  } else {
    items.push('Top Dog immunity challenge complete');
    items.push('Tribal council awaits the losers');
    items.push('One player is safe tonight');
  }
  const doubled = [...items, ...items].map(t => `<span>${t}</span>`).join('');
  return `<div class="td-ticker"><div class="td-ticker-label">UPDATE</div><div class="td-ticker-scroll">${doubled}</div></div>`;
}

function _buildViewport(phaseCls) {
  if (phaseCls === 'td-forest') {
    const trees = [15, 35, 55, 75, 90].map((l, i) =>
      `<div class="td-vp-tree" style="left:${l}%;height:0;border-bottom-width:${18 + (i % 3) * 4}px"></div>`
    ).join('');
    return `<div class="td-viewport td-vp-forest">${trees}</div>`;
  }
  if (phaseCls === 'td-winner') {
    return '<div class="td-viewport td-vp-meadow"></div>';
  }
  return '<div class="td-viewport td-vp-barn"></div>';
}

function _shell(content, ep, phaseCls = '') {
  window._tdData = ep.topDog;
  window._tdEp = ep;
  const isForest = phaseCls === 'td-forest';
  const shellCls = isForest ? 'td-forest' : phaseCls === 'td-winner' ? 'td-winner' : '';
  const particles = isForest ? _buildForestParticles() : _buildAnimalParticles();
  return `${_css()}<div class="td-shell ${shellCls}" data-phase="${phaseCls}">
    <span class="td-nail td-nail-tl"></span><span class="td-nail td-nail-tr"></span>
    <span class="td-nail td-nail-bl"></span><span class="td-nail td-nail-br"></span>
    ${_buildTransition(phaseCls)}
    ${particles}
    ${_buildHUD(phaseCls)}
    <div style="display:flex;flex:1;min-height:0">
      <div class="td-main">${_buildTreatBar(phaseCls, ep)}<div style="padding:14px 0 0 0">${content}</div></div>
      <div class="td-sidebar" id="td-sidebar">${_buildViewport(phaseCls)}${_buildSidebarContent(ep.topDog, phaseCls, ep)}</div>
    </div>
    ${_buildTicker(phaseCls, ep)}
  </div>`;
}


// ══════════════════════════════════════════════════════════════
// SIDEBAR CONTENT (Layer 9 — Interactive, gated by _tvState)
// ══════════════════════════════════════════════════════════════
function _buildSidebarPet(phaseCls) {
  const isForest = phaseCls === 'td-forest' || phaseCls === 'td-winner';
  return `<div class="td-sb-pet">
    ${isForest
      ? '<div class="td-sb-pet-bunny"></div><div class="td-sb-pet-songbird"></div>'
      : '<div class="td-sb-pet-cat"></div><div class="td-sb-pet-dog"></div>'}
  </div>`;
}

function _buildSidebarContent(data, phase, ep) {
  if (!data) return '<div class="td-sb-title">NO DATA</div>';

  if (phase === 'td-petshop-assign') return _buildSidebarPet(phase) + _sidebarAssignment(data);
  if (phase === 'td-petshop-training') return _buildSidebarPet(phase) + _sidebarTraining(data);
  if (phase === 'td-petshop-judging') return _buildSidebarPet(phase) + _sidebarJudging(data);
  if (phase === 'td-forest') return _buildSidebarPet(phase) + _sidebarForest(data);
  if (phase === 'td-winner') return _buildSidebarPet(phase) + _sidebarWinner(data, ep);
  return _sidebarRoster(data);
}

function _sidebarRoster(data) {
  let h = '<div class="td-sb-title">ADOPTION BOARD</div>';
  const assignments = data.phase1?.assignments || [];
  assignments.forEach(a => {
    const sl = slug(a.player);
    h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${a.player}" onerror="this.style.display='none'"><span class="td-sb-name">${a.player}</span><span class="td-sb-tag td-gold">READY</span></div>`;
  });
  h += `<div class="td-sb-section"><div class="td-sb-title">CHALLENGE BRIEF</div><div style="font-size:0.72rem;color:var(--pet-brown);line-height:1.4">Phase 1: Adopt your pet, train them, and perform for the judges. Phase 2: Adventure through the forest trail. First to the meadow exit wins immunity!</div></div>`;
  return h;
}

function _sidebarAssignment(data) {
  const st = _tvState['td-assign'];
  const revIdx = st ? st.idx : -1;
  const assignments = data.phase1?.assignments || [];

  let h = '<div class="td-sb-title">ADOPTION BOARD</div>';
  assignments.forEach((a, i) => {
    const sl = slug(a.player);
    const revealed = i <= revIdx;
    if (revealed) {
      const pct = Math.round(a.compatibility * 10);
      const barCls = a.compatibility >= 6.5 ? 'td-gold' : a.compatibility >= 4 ? 'td-amber' : 'td-crimson';
      const animal = a.animal;
      h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${a.player}" onerror="this.style.display='none'"><span class="td-sb-name">${a.player}</span><span class="td-sb-tag td-gold">${animal.name}</span></div>`;
      h += `<div style="display:flex;gap:4px;align-items:center;margin:1px 0 3px 0"><div class="td-compat-bar" style="flex:1"><div class="td-compat-fill ${barCls}" style="width:${pct}%"></div></div>${_moodMeter(a.mood || 3, animal.name)}</div>`;
    } else {
      h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${a.player}" onerror="this.style.display='none'"><span class="td-sb-name">${a.player}</span><span class="td-sb-tag td-grey">???</span></div>`;
    }
  });
  return h;
}

function _sidebarTraining(data) {
  const st = _tvState['td-training'];
  const revIdx = st ? st.idx : -1;
  const assignments = data.phase1?.assignments || [];
  const rounds = data.phase1?.trainingRounds || [];
  const roundsRevealed = revIdx + 1;

  let h = `<div class="td-sb-title">TRAINING PROGRESS</div>`;
  h += `<div style="text-align:center;font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted);margin:4px 0">ROUND ${Math.min(roundsRevealed, rounds.length)} / ${rounds.length}</div>`;

  assignments.forEach(a => {
    const sl = slug(a.player);
    let successes = 0, lastMood = a.mood || 3;
    for (let r = 0; r < roundsRevealed && r < rounds.length; r++) {
      const res = rounds[r].results?.find(rr => rr.player === a.player);
      if (res?.outcome === 'success') successes++;
      if (res && typeof res.mood === 'number') lastMood = res.mood;
    }
    const total = Math.min(roundsRevealed, rounds.length);
    const pct = total > 0 ? Math.round((successes / total) * 100) : 0;
    const barCls = pct >= 75 ? 'td-gold' : pct >= 50 ? 'td-amber' : 'td-crimson';

    h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${a.player}" onerror="this.style.display='none'"><span class="td-sb-name">${a.player}</span><span class="td-sb-tag ${pct >= 75 ? 'td-gold' : pct >= 50 ? 'td-amber' : 'td-crimson'}">${successes}/${total}</span></div>`;
    h += `<div style="display:flex;gap:4px;align-items:center;margin:1px 0 3px 0"><div class="td-compat-bar" style="flex:1"><div class="td-compat-fill ${barCls}" style="width:${pct}%"></div></div>${_moodMeter(lastMood, a.animal?.name || '?')}</div>`;
  });
  return h;
}

function _sidebarJudging(data) {
  const st = _tvState['td-judging'];
  const revIdx = st ? st.idx : -1;
  const perfs = data.phase1?.performances || [];

  let h = '<div class="td-sb-title">TALENT SHOW SCORES</div>';
  // Build leaderboard gated by reveal
  const revealed = perfs.filter((_, i) => i <= revIdx);
  const sorted = [...revealed].sort((a, b) => b.total - a.total);
  sorted.forEach((p, i) => {
    const sl = slug(p.player);
    const animal = p.animalObj || {};
    h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${p.player}" onerror="this.style.display='none'"><span class="td-sb-name">${p.player}</span><span class="td-sb-tag td-gold">${p.total}/20</span></div>`;
  });
  // Unrevealed
  perfs.forEach((p, i) => {
    if (i > revIdx) {
      const sl = slug(p.player);
      h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${p.player}" onerror="this.style.display='none'"><span class="td-sb-name">${p.player}</span><span class="td-sb-tag td-grey">???</span></div>`;
    }
  });
  return h;
}

function _sidebarForest(data) {
  const st = _tvState['td-forest-race'];
  const revIdx = st ? st.idx : -1;
  const rounds = data.phase2?.rounds || [];
  const roundsRevealed = revIdx + 1;
  const positions = data.phase2?.positions || {};
  const assignments = data.phase1?.assignments || [];

  let h = '<div class="td-sb-title">ADVENTURE MAP</div>';

  // Trail segments
  h += '<div class="td-trail">';
  for (let seg = FOREST_LENGTH; seg >= 0; seg--) {
    const isFinish = seg === FOREST_LENGTH;
    let segCls = isFinish ? 'td-finish' : '';

    // Player dots at this segment (based on revealed positions)
    let dots = '';
    if (roundsRevealed > 0) {
      assignments.forEach(a => {
        // Calculate position from revealed rounds
        let pos = 0;
        const performances = data.phase1?.performances || [];
        const perfIdx = performances.findIndex(p => p.player === a.player);
        if (perfIdx === 0) pos = 3;
        else if (perfIdx === 1) pos = 2;
        else if (perfIdx === 2) pos = 1;

        for (let r = 0; r < roundsRevealed && r < rounds.length; r++) {
          const mov = rounds[r].movements?.find(m => m.player === a.player);
          if (mov) pos = mov.position;
        }

        const playerSeg = Math.min(FOREST_LENGTH, Math.floor(pos));
        if (playerSeg === seg) {
          const sl = slug(a.player);
          const borderColor = a.compatibility >= 6.5 ? 'var(--pet-mint)' : a.compatibility >= 4 ? 'var(--pet-peach)' : 'var(--pet-danger)';
          dots += `<span class="td-trail-dot" style="border-color:${borderColor}" title="${a.player}"><img src="assets/avatars/${sl}.png" alt="${a.player}" onerror="this.style.display='none'"></span>`;
          segCls += ' td-reached';
        }
      });
    }

    const dotsWrap = dots ? `<div class="td-trail-icons">${dots}</div>` : '';
    h += `<div class="td-trail-seg ${segCls}"><span>${isFinish ? 'MEADOW' : seg}</span>${dotsWrap}</div>`;
  }
  h += '</div>';

  // Mood + position arrows for each player
  if (roundsRevealed > 0) {
    h += '<div class="td-sb-title" style="margin-top:10px">ANIMAL STATUS</div>';

    // Calculate current and previous ranks for arrows
    const playerPositions = [];
    assignments.forEach(a => {
      let pos = 0, prevPos = 0, lastMood = a.mood || 3;
      const performances = data.phase1?.performances || [];
      const perfIdx = performances.findIndex(p => p.player === a.player);
      if (perfIdx === 0) pos = 3;
      else if (perfIdx === 1) pos = 2;
      else if (perfIdx === 2) pos = 1;
      prevPos = pos;

      for (let r = 0; r < roundsRevealed && r < rounds.length; r++) {
        const mov = rounds[r].movements?.find(m => m.player === a.player);
        if (mov) {
          if (r < roundsRevealed - 1) prevPos = mov.position;
          pos = mov.position;
        }
        if (mov && typeof mov.mood === 'number') lastMood = mov.mood;
      }
      playerPositions.push({ player: a.player, pos, prevPos, lastMood, animal: a.animal });
    });

    // Sort by position (leader first)
    playerPositions.sort((a, b) => b.pos - a.pos);
    const prevRanks = {};
    [...playerPositions].sort((a, b) => b.prevPos - a.prevPos).forEach((p, i) => { prevRanks[p.player] = i; });

    playerPositions.forEach((p, curRank) => {
      const sl = slug(p.player);
      const prevRank = prevRanks[p.player] ?? curRank;
      const arrow = curRank < prevRank ? '<span class="td-arrow-up"></span>' : curRank > prevRank ? '<span class="td-arrow-down"></span>' : '<span class="td-arrow-same"></span>';
      h += `<div class="td-sb-row">${arrow}<img src="assets/avatars/${sl}.png" alt="${p.player}" onerror="this.style.display='none'"><span class="td-sb-name" style="flex:1">${p.player}</span>${_moodMeter(p.lastMood, p.animal?.name || '?')}</div>`;
    });
  }

  return h;
}

function _sidebarWinner(data, ep) {
  let h = '<div class="td-sb-title">BEST IN SHOW</div>';
  const finishOrder = data.phase2?.finishOrder || [];
  const winner = data.immunityWinner;
  const scores = ep?.chalMemberScores || {};

  finishOrder.forEach((n, i) => {
    const sl = slug(n);
    const isWinner = n === winner;
    let tag = '';
    if (isWinner) tag = '<span class="td-sb-tag td-crown">IMMUNE</span>';
    else tag = `<span class="td-sb-tag td-gold">#${i + 1}</span>`;
    h += `<div class="td-sb-row"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="td-sb-name">${n}</span>${tag}</div>`;
  });

  return h;
}


// ══════════════════════════════════════════════════════════════
// SCREEN 1: TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogTitleCard(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const assignments = data.phase1?.assignments || [];

  const animalRing = assignments.map((a, i) => {
    const angle = (i / assignments.length) * 360;
    const radius = 80;
    const x = Math.cos(angle * Math.PI / 180) * radius;
    const y = Math.sin(angle * Math.PI / 180) * radius;
    return `<span style="position:absolute;left:calc(50% + ${x}px - 11px);top:calc(50% + ${y}px - 11px);opacity:0.5">${_icon('paw')}</span>`;
  }).join('');

  let posters = assignments.map(a => `<div style="display:inline-block;margin:2px">${_poster(a.player, 'td-high')}</div>`).join('');

  const content = `
    <div class="td-h1" style="font-size:2.2rem;margin:20px 0 6px">TOP DOG</div>
    <div style="text-align:center;font-family:'Inter',sans-serif;font-size:0.8rem;font-weight:700;color:var(--pet-muted);letter-spacing:4px;margin-bottom:16px;text-transform:uppercase">TOP DOG CHALLENGE</div>
    <div class="td-host">${data.hostOpening || ''}</div>
    <div style="text-align:center;margin:16px 0;position:relative;height:200px">
      <div style="position:relative;width:200px;height:200px;margin:0 auto">${animalRing}</div>
    </div>
    <div style="text-align:center;margin:12px 0">
      <div style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:800;color:var(--pet-brown);letter-spacing:2px;margin-bottom:8px;text-transform:uppercase">Contestants</div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px">${posters}</div>
    </div>
    <div style="margin-top:16px;text-align:center">
      <div class="td-card" style="display:inline-block;max-width:420px;text-align:left">
        <div class="td-h3">Challenge Rules</div>
        <div style="font-size:0.82rem;line-height:1.6;color:var(--pet-brown)">
          <b style="color:var(--pet-hot-pink)">Phase 1</b> — Adopt your pet + Train them + Talent show performance<br>
          <b style="color:var(--pet-green)">Phase 2</b> — Forest adventure trail (14 segments to the meadow)<br>
          <span style="color:var(--pet-brown);font-weight:600">Top performance score = head start on the trail. First to the meadow wins immunity!</span>
        </div>
      </div>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders['td-title'] = rpBuildTopDogTitleCard;
  return _shell(content, ep, '');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 2: ANIMAL ASSIGNMENT
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogAssignment(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const assignments = data.phase1?.assignments || [];
  const totalSteps = assignments.length;
  const stKey = 'td-assign';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';
  assignments.forEach((a, i) => {
    const hide = i <= st.idx ? '' : 'display:none';
    const pct = Math.round(a.compatibility * 10);
    const barCls = a.compatibility >= 6.5 ? 'td-gold' : a.compatibility >= 4 ? 'td-amber' : 'td-crimson';
    const posterCls = a.compatibility >= 6.5 ? 'td-high' : a.compatibility >= 4 ? 'td-mid' : 'td-low';

    // Archetype bonus/penalty description
    const playerArch = arch(a.player);
    let bonusText = '';
    if (a.compatibility >= 7) bonusText = `<span style="color:var(--pet-green);font-size:0.75rem"> — Natural affinity!</span>`;
    else if (a.compatibility <= 3) bonusText = `<span style="color:var(--pet-danger);font-size:0.75rem"> — This could be trouble...</span>`;

    steps += `<div id="td-step-${stKey}-${i}" class="td-step" style="${hide}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        ${_poster(a.player, posterCls, { text: a.animal.name, cls: 'td-gold' })}
        <div style="flex:1">
          <div style="font-size:0.78rem;color:var(--pet-brown);font-family:'Inter',sans-serif;font-weight:600">
            ${_icon('paw')} ${a.animal.name} — <span style="color:var(--pet-hot-pink)">${'●'.repeat(a.animal.danger)}${'○'.repeat(5 - a.animal.danger)}</span> — ${a.animal.temperament}${bonusText}
          </div>
          <div style="font-size:0.7rem;color:var(--pet-muted);font-family:'Inter',sans-serif;font-weight:600;letter-spacing:0.5px">COMPATIBILITY: ${a.compatibility.toFixed(1)}/10</div>
          <div class="td-bar-wrap"><div class="td-bar ${barCls}" style="width:${pct}%"></div></div>
          <div style="font-size:0.7rem;color:var(--pet-muted);font-family:'Inter',sans-serif;font-weight:600;letter-spacing:0.5px;margin-top:2px">MOOD: ${_moodMeter(a.mood || 3, a.animal?.name || '?')}</div>
        </div>
      </div>
      <div class="td-card">${_icon(a.compatibility >= 5.5 ? 'heart' : 'thorn')}${a.reactionText}</div>
    </div>`;

    // Confessional + comm chatter between reveals
    if (i > 0 && i % 2 === 1) {
      const confType = a.compatibility >= 5.5 ? 'draftGood' : 'draftBad';
      const conf = _confessionalCard(a.player, a.animal.name, confType);
      if (conf) steps += `<div id="td-step-${stKey}-${i}b" class="td-step" style="${hide}">${conf}</div>`;
    } else if (i > 0 && i % 3 === 0) {
      const chatter = _pickWhisper('td-petshop', 1);
      if (chatter.length) steps += `<div id="td-step-${stKey}-${i}b" class="td-step" style="${hide}">${_whisperDiv(chatter[0])}</div>`;
    }
  });

  const content = `
    <div class="td-h1">Animal Draft</div>
    <div style="text-align:center;font-family:'Inter',sans-serif;font-size:0.75rem;font-weight:700;color:var(--pet-muted);letter-spacing:2px;margin-bottom:10px">PRIORITY PICK — HIGHEST SOCIAL+BOLDNESS ADOPTS FIRST</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div id="td-controls-${stKey}" class="td-reveal-bar">
      <button id="td-btn-${stKey}" class="td-btn" data-td-action="next" data-td-key="${stKey}" data-td-total="${totalSteps}">Next Adoption ▸</button>
      <button class="td-btn td-btn-reveal-all" data-td-action="all" data-td-key="${stKey}" data-td-total="${totalSteps}">Reveal All ▸▸</button>
      <span id="td-counter-${stKey}" style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted)">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogAssignment;
  return _shell(content, ep, 'td-petshop-assign');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 3: TRAINING MONTAGE
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogTraining(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const rounds = data.phase1?.trainingRounds || [];
  const assignments = data.phase1?.assignments || [];
  const totalSteps = rounds.length;
  const stKey = 'td-training';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';

  rounds.forEach((round, i) => {
    const hide = i <= st.idx ? '' : 'display:none';

    // Training results for each player
    let resultCards = (round.results || []).map(r => {
      const assign = assignments.find(a => a.player === r.player);
      const animal = assign?.animal || { name: '?', icon: '?' };

      if (r.outcome === 'unique_trigger') {
        return `<div class="td-card td-trigger-card">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            ${_poster(r.player, 'td-mid', { text: animal.name, cls: 'td-gold' })}
            ${_icon('paw')}
            ${typeof r.mood === 'number' ? _moodMeter(r.mood, animal.name) : ''}
          </div>
          <div style="font-size:0.84rem">${r.text}</div>
        </div>`;
      }

      if (r.outcome === 'refusal') {
        return `<div class="td-card td-refusal-card">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            ${_poster(r.player, 'td-low', { text: animal.name, cls: 'td-crimson' })}
            ${_icon('fishbone')}
            <span style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-danger);text-transform:uppercase;letter-spacing:0.5px">REFUSED</span>
            ${typeof r.mood === 'number' ? _moodMeter(r.mood, animal.name) : ''}
          </div>
          <div style="font-size:0.84rem">${r.text}</div>
        </div>`;
      }

      const cardCls = r.outcome === 'success' ? 'td-success-card' : r.outcome === 'critical_failure' ? 'td-fail-card' : '';
      const iconType = r.outcome === 'success' ? 'star' : r.outcome === 'critical_failure' ? 'fishbone' : 'bone';
      const posterCls = r.outcome === 'success' ? 'td-high' : r.outcome === 'critical_failure' ? 'td-low' : 'td-mid';

      return `<div class="td-card ${cardCls}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${_poster(r.player, posterCls, { text: animal.name, cls: r.outcome === 'success' ? 'td-gold' : 'td-crimson' })}
          ${_icon(iconType)}
          <span style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted);text-transform:uppercase;letter-spacing:0.5px">${r.outcome.replace('_', ' ')}</span>
          ${typeof r.mood === 'number' ? _moodMeter(r.mood, animal.name) : ''}
        </div>
        <div style="font-size:0.84rem">${r.text}</div>
      </div>`;
    }).join('');

    // Social events for this round
    let socHtml = (round.socialEvents || []).map(se => {
      return `<div class="td-card td-social">${_icon(se.type)}${se.text}</div>`;
    }).join('');

    // Mole action
    let moleHtml = '';
    if (round.moleAction) {
      moleHtml = `<div class="td-card td-mole-card">${_icon('mole')}${round.moleAction.text}</div>`;
    }

    // Comm chatter
    let chatter = '';
    if (i > 0 && i % 2 === 0) {
      const ch = _pickWhisper('td-petshop', 1);
      if (ch.length) chatter = _whisperDiv(ch[0]);
    }

    // Confessional from a notable player this round
    let confHtml = '';
    if (i > 0) {
      const results = round.results || [];
      const crits = results.filter(r => r.outcome === 'critical_failure');
      const wins = results.filter(r => r.outcome === 'success');
      let confPlayer = null, confAnimal = '', confType = '';
      const refusals = results.filter(r => r.outcome === 'refusal');
      const moodTriggers = results.filter(r => r.outcome === 'unique_trigger');
      const highMoods = results.filter(r => typeof r.mood === 'number' && r.mood >= 5);
      const lowMoods = results.filter(r => typeof r.mood === 'number' && r.mood <= 1);

      if (refusals.length > 0) {
        const r = pick(refusals);
        confPlayer = r.player;
        confAnimal = assignments.find(a => a.player === r.player)?.animal?.name || '?';
        confType = 'animalRefused';
      } else if (lowMoods.length > 0 && Math.random() < 0.7) {
        const r = pick(lowMoods);
        confPlayer = r.player;
        confAnimal = assignments.find(a => a.player === r.player)?.animal?.name || '?';
        confType = 'moodLow';
      } else if (highMoods.length > 0 && Math.random() < 0.5) {
        const r = pick(highMoods);
        confPlayer = r.player;
        confAnimal = assignments.find(a => a.player === r.player)?.animal?.name || '?';
        confType = 'moodHigh';
      } else if (crits.length > 0) {
        const r = pick(crits);
        confPlayer = r.player;
        confAnimal = assignments.find(a => a.player === r.player)?.animal?.name || '?';
        confType = 'trainingFail';
      } else if (wins.length > 0 && Math.random() < 0.5) {
        const r = pick(wins);
        confPlayer = r.player;
        confAnimal = assignments.find(a => a.player === r.player)?.animal?.name || '?';
        confType = 'trainingSuccess';
      }
      if (confPlayer) confHtml = _confessionalCard(confPlayer, confAnimal, confType);
    }

    steps += `<div id="td-step-${stKey}-${i}" class="td-step" style="${hide}">
      ${chatter}
      <div class="td-h2">Round ${round.round} <span style="font-size:0.7rem;color:var(--pet-muted)">${i + 1}/${totalSteps}</span></div>
      ${resultCards}${socHtml}${moleHtml}${confHtml}
    </div>`;
  });

  const content = `
    <div class="td-h1">Boot Camp</div>
    <div class="td-host">${data.hostTrainingStart || ''}</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div id="td-controls-${stKey}" class="td-reveal-bar">
      <button id="td-btn-${stKey}" class="td-btn" data-td-action="next" data-td-key="${stKey}" data-td-total="${totalSteps}">Next Round ▸</button>
      <button class="td-btn td-btn-reveal-all" data-td-action="all" data-td-key="${stKey}" data-td-total="${totalSteps}">Reveal All ▸▸</button>
      <span id="td-counter-${stKey}" style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted)">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogTraining;
  return _shell(content, ep, 'td-petshop-training');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 4: JUDGING PERFORMANCE
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogJudging(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const perfs = data.phase1?.performances || [];
  const totalSteps = perfs.length + 1;
  const stKey = 'td-judging';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';

  perfs.forEach((p, i) => {
    const hide = i <= st.idx ? '' : 'display:none';
    const animal = p.animalObj || { name: '?', icon: '?' };
    const posterCls = p.tier === 'standingOvation' || p.tier === 'impressed' ? 'td-high' : p.tier === 'meh' ? 'td-mid' : 'td-low';
    const scoreColor = p.total >= 16 ? 'var(--pet-green)' : p.total >= 12 ? 'var(--pet-brown)' : p.total >= 8 ? 'var(--pet-peach)' : 'var(--pet-danger)';

    const moodHtml = typeof p.mood === 'number' ? `<div style="margin-top:4px;text-align:center">${_moodMeter(p.mood, animal.name)}</div>` : '';
    const refusedTag = p.refused ? `<div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:0.9rem;color:var(--pet-danger);letter-spacing:2px;text-align:center;margin:4px 0">ANIMAL REFUSED TO PERFORM</div>` : '';

    steps += `<div id="td-step-${stKey}-${i}" class="td-step" style="${hide}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        ${_poster(p.player, posterCls, { text: animal.name, cls: 'td-gold' })}
        ${_icon(p.tier)}
        ${typeof p.mood === 'number' ? _moodMeter(p.mood, animal.name) : ''}
      </div>
      ${refusedTag}
      <div class="td-card${p.refused ? ' td-refusal-card' : ''}">${_icon('feather')}${p.perfText}</div>
      <div style="display:flex;gap:8px;margin:6px 0;flex-wrap:wrap">
        <div class="td-card td-scoreflip" style="flex:1;min-width:180px;text-align:center;border-color:rgba(168,216,200,0.4)">
          <div style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:800;color:var(--pet-muted);letter-spacing:0.5px;text-transform:uppercase">Chris</div>
          <div style="font-family:'Inter',sans-serif;font-size:2rem;color:${scoreColor};font-weight:800">${p.chrisScore}</div>
          <div style="font-size:0.82rem;margin-top:4px">${p.chrisText}</div>
        </div>
        <div class="td-card td-scoreflip" style="flex:1;min-width:180px;text-align:center;border-color:rgba(168,216,200,0.4);animation-delay:0.2s">
          <div style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:800;color:var(--pet-muted);letter-spacing:0.5px;text-transform:uppercase">Chef</div>
          <div style="font-family:'Inter',sans-serif;font-size:2rem;color:${scoreColor};font-weight:800">${p.chefScore}</div>
          <div style="font-size:0.82rem;margin-top:4px">${p.chefText}</div>
        </div>
      </div>
      <div style="text-align:center;font-family:'Inter',sans-serif;font-size:1.2rem;color:${scoreColor};font-weight:800;letter-spacing:2px">TOTAL: ${p.total}/20</div>
      <div style="display:flex;justify-content:center;gap:16px;margin-top:6px">
        <div class="td-judge-react ${p.total >= 16 ? 'td-judge-react-love' : p.total <= 6 ? 'td-judge-react-hate' : 'td-judge-react-meh'}"><span class="td-judge-icon td-judge-chris">C</span> ${p.chrisScore >= 8 ? 'Impressed!' : p.chrisScore <= 3 ? 'Disgusted.' : 'Hmm.'}</div>
        <div class="td-judge-react ${p.total >= 16 ? 'td-judge-react-love' : p.total <= 6 ? 'td-judge-react-hate' : 'td-judge-react-meh'}"><span class="td-judge-icon td-judge-chef">Ch</span> ${p.chefScore >= 8 ? 'Standing ovation!' : p.chefScore <= 3 ? '*walks away*' : 'Acceptable.'}</div>
      </div>
    </div>`;

    // Confessional after notable scores
    if (p.total >= 16 || p.total <= 6) {
      const confType = p.total >= 16 ? 'judgingHigh' : 'judgingLow';
      const conf = _confessionalCard(p.player, animal.name, confType);
      if (conf) steps += `<div id="td-step-${stKey}-${i}b" class="td-step" style="${hide}">${conf}</div>`;
    } else if (i > 0 && i % 2 === 1) {
      const ch = _pickWhisper('td-petshop', 1);
      if (ch.length) steps += `<div id="td-step-${stKey}-${i}b" class="td-step" style="${hide}">${_whisperDiv(ch[0])}</div>`;
    }
  });

  // Winner announcement step
  const judgingWinner = perfs[0];
  const winIdx = perfs.length;
  const hideWin = winIdx <= st.idx ? '' : 'display:none';
  if (judgingWinner) {
    const winAnimal = judgingWinner.animalObj || { name: '?', icon: '?' };
    const runnerUp = perfs[1];
    const lastPlace = perfs[perfs.length - 1];
    steps += `<div id="td-step-${stKey}-${winIdx}" class="td-step" style="${hideWin}">
      <div class="td-card" style="border:2px solid #e8c050;background:linear-gradient(135deg,rgba(232,192,80,0.08),rgba(200,160,96,0.05));text-align:center;padding:16px">
        ${_icon('star')}
        <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:1.4rem;color:#a08020;letter-spacing:3px;margin:8px 0">TOP SCORER</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:8px 0">
          ${portrait(judgingWinner.player, 52)}
          <div style="text-align:left">
            <div style="font-family:'Inter',sans-serif;font-size:1.1rem;font-weight:800;color:var(--pet-text)">${judgingWinner.player}</div>
            <div style="font-size:0.8rem;color:var(--pet-brown)">${_icon('heart')} with ${winAnimal.name} — ${judgingWinner.total}/20</div>
          </div>
        </div>
        <div style="margin:10px 0;padding:8px;background:rgba(92,61,46,0.06);border-radius:4px;font-size:0.85rem">
          ${_icon('ribbon')} <strong>${judgingWinner.player}</strong> earns a <strong style="color:#a08020">3-segment head start</strong> in the Wilderness Race!
          ${runnerUp ? `<br>${runnerUp.player} starts at 2. ` : ''}
          ${lastPlace ? `<br><span style="color:var(--pet-danger)">${lastPlace.player}</span> starts dead last — zero head start.` : ''}
        </div>
        <div style="font-size:0.82rem;color:var(--pet-muted);font-style:italic;margin-top:6px">${host()}: "Pack your bags. The forest doesn't care about your feelings."</div>
      </div>
    </div>`;
  }

  const content = `
    <div class="td-h1">Talent Showdown</div>
    <div class="td-host">${data.hostJudgingStart || ''}</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div id="td-controls-${stKey}" class="td-reveal-bar">
      <button id="td-btn-${stKey}" class="td-btn" data-td-action="next" data-td-key="${stKey}" data-td-total="${totalSteps}">Next Performance ▸</button>
      <button class="td-btn td-btn-reveal-all" data-td-action="all" data-td-key="${stKey}" data-td-total="${totalSteps}">Reveal All ▸▸</button>
      <span id="td-counter-${stKey}" style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:var(--pet-muted)">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogJudging;
  return _shell(content, ep, 'td-petshop-judging');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 5: FOREST RACE
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogForest(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const rounds = data.phase2?.rounds || [];
  const totalSteps = rounds.length;
  const stKey = 'td-forest-race';
  const st = _ensureState(stKey, totalSteps);

  let steps = '';

  rounds.forEach((round, i) => {
    const hide = i <= st.idx ? '' : 'display:none';

    // Movement cards
    let moveCards = (round.movements || []).map(m => {
      const assign = data.phase1.assignments.find(a => a.player === m.player);
      const animal = assign?.animal || { name: '?', icon: '?' };
      const pos = Math.floor(m.position);

      // Refusal — animal stopped dead
      if (m.moveType === 'refusal') {
        return `<div class="td-card td-forest-card td-refusal-card">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            ${_poster(m.player, 'td-low', { text: `${pos}/${FOREST_LENGTH}`, cls: 'td-crimson' })}
            ${_icon('fishbone')}
            <span style="font-size:0.65rem;font-weight:700;color:var(--pet-danger);letter-spacing:1px;font-family:'Inter',sans-serif">STOPPED</span>
            ${typeof m.mood === 'number' ? _moodMeter(m.mood, animal.name) : ''}
          </div>
          <div style="font-size:0.84rem">${m.text}</div>
        </div>`;
      }

      const goodTypes = ['fast', 'leading', 'nearFinish', 'enterHomeStretch', 'chasing'];
      const badTypes = ['slow', 'falling'];
      const speedCls = goodTypes.includes(m.moveType) ? 'td-success-card' : badTypes.includes(m.moveType) ? 'td-fail-card' : '';
      const posterCls = goodTypes.includes(m.moveType) ? 'td-high' : badTypes.includes(m.moveType) ? 'td-low' : 'td-mid';
      const zone = pos >= 11 ? 'HOME STRETCH' : pos >= 5 ? 'DEEP WOODS' : 'TRAILHEAD';
      const zoneColor = pos >= 11 ? 'var(--pet-success)' : pos >= 5 ? 'var(--pet-peach)' : 'var(--pet-muted)';
      const posText = `${pos}/${FOREST_LENGTH}`;

      return `<div class="td-card td-forest-card ${speedCls}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          ${_poster(m.player, posterCls, { text: posText, cls: 'td-gold' })}
          ${_icon(m.moveType === 'leading' ? 'star' : m.moveType === 'nearFinish' ? 'ribbon' : m.moveType === 'falling' ? 'fishbone' : 'paw')}
          <span style="font-size:0.6rem;font-weight:700;color:${zoneColor};letter-spacing:1px;font-family:'Inter',sans-serif">${zone}</span>
          ${typeof m.mood === 'number' ? _moodMeter(m.mood, animal.name) : ''}
        </div>
        <div style="font-size:0.84rem">${m.text}</div>
      </div>`;
    }).join('');

    // Encounters
    let encounterCards = (round.encounters || []).map(e => {
      if (e.type === 'unique_trigger') {
        return `<div class="td-card td-forest-card td-trigger-card">${_icon('paw')}${e.text}</div>`;
      }
      const iconType = e.type === 'trap' ? 'cage' : e.type === 'navigation' ? 'leaf' : e.type === 'obstacle' ? 'pawtrail' : e.type === 'animalMoment' ? 'paw' : e.subType || 'paw';
      const cardCls = (e.segDelta > 0 || e.outcome === 'success') ? 'td-success-card' : (e.segDelta < 0 || e.outcome === 'failure') ? 'td-fail-card' : '';
      return `<div class="td-card td-forest-card ${cardCls}">${_icon(iconType)}${e.text}</div>`;
    }).join('');

    // Social events
    let socHtml = (round.socialEvents || []).map(se => {
      return `<div class="td-card td-social">${_icon(se.type)}${se.text}</div>`;
    }).join('');

    // Mole actions
    let moleHtml = (round.moleActions || []).map(ma => {
      return `<div class="td-card td-mole-card">${_icon('mole')}${ma.text}</div>`;
    }).join('');

    // Finisher announcements
    let finisherHtml = (round.finishers || []).map(f => {
      if (f.isWinner) {
        return `<div class="td-card" style="border:2px solid #e8c050;background:linear-gradient(135deg,rgba(232,192,80,0.12),rgba(200,160,96,0.06));text-align:center;padding:14px">
          ${_icon('star')}
          <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:1.3rem;color:#a08020;letter-spacing:3px;margin:6px 0">IMMUNITY WINNER</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:6px 0">
            ${portrait(f.player, 48)}
            <div style="font-family:'Inter',sans-serif;font-size:1.1rem;font-weight:800;color:var(--pet-text)">${f.player} & ${f.animal}</div>
          </div>
          <div style="font-size:0.85rem;color:var(--pet-muted);font-style:italic">${host()}: "${f.player.toUpperCase()} BURSTS OUT OF THE FOREST! FIRST TO THE MEADOW! ${f.player.toUpperCase()} WINS IMMUNITY!"</div>
        </div>`;
      } else {
        return `<div class="td-card" style="border:1px solid var(--pet-mint);background:rgba(90,154,72,0.05);padding:10px">
          ${_icon('ribbon')} <strong>${f.player}</strong> and the ${f.animal} cross the finish line!
          <span style="font-size:0.8rem;color:var(--pet-muted);font-style:italic"> — ${host()}: "Too late for immunity, but at least you made it out alive."</span>
        </div>`;
      }
    }).join('');

    // Comm chatter
    let chatter = '';
    if (i > 0 && i % 3 === 0) {
      const ch = _pickWhisper('td-forest', 1);
      if (ch.length) chatter = _whisperDiv(ch[0]);
    }

    // Confessional from leader or last place
    let confHtml = '';
    if (i > 0 && round.movements?.length > 1) {
      const leadMove = round.movements.find(m => m.moveType === 'leading' || m.moveType === 'nearFinish');
      const lastMove = round.movements.find(m => m.moveType === 'falling');
      if (leadMove && Math.random() < 0.5) {
        const an = data.phase1.assignments.find(a => a.player === leadMove.player)?.animal?.name || '?';
        confHtml = _confessionalCard(leadMove.player, an, 'forestLead');
      } else if (lastMove && Math.random() < 0.6) {
        const an = data.phase1.assignments.find(a => a.player === lastMove.player)?.animal?.name || '?';
        confHtml = _confessionalCard(lastMove.player, an, 'forestLast');
      }
    }

    // BREAKING alert for lead changes
    let breakingHtml = '';
    if (round.leadChange) {
      const lc = round.leadChange;
      breakingHtml = `<div class="td-breaking"><div class="td-breaking-text">${_icon('star')} ${lc.newLeader} and the ${lc.animal} TAKE THE LEAD from ${lc.oldLeader}!</div></div>`;
    }

    // Photo finish alert
    let photoHtml = '';
    if (round.photoFinish) {
      const pf = round.photoFinish;
      photoHtml = `<div class="td-photo-finish"><div class="td-photo-finish-names">${pf.player1} vs ${pf.player2}</div><div class="td-photo-finish-gap">${pf.gap} segments apart — IT'S ANYONE'S RACE!</div></div>`;
    }

    // Tension escalation — later rounds get more intense
    const tensionLvl = rounds.length <= 3 ? 1 : Math.min(5, Math.ceil((i + 1) / (rounds.length / 5)));
    const tensionCls = `td-tension-${tensionLvl}`;

    steps += `<div id="td-step-${stKey}-${i}" class="td-step ${tensionCls}" style="${hide}">
      ${chatter}${breakingHtml}
      <div class="td-h2" style="color:var(--pet-cream)">Round ${round.round}</div>
      ${moveCards}${encounterCards}${socHtml}${moleHtml}${confHtml}${photoHtml}${finisherHtml}
    </div>`;
  });

  const content = `
    <div class="td-h1" style="color:var(--pet-cream);text-shadow:0 1px 2px rgba(0,0,0,0.2)">Wilderness Race</div>
    <div class="td-host" style="color:var(--pet-cream);border-left-color:var(--pet-grass)">${data.hostForestStart || ''}</div>
    <div data-screen-key="${stKey}">${steps}</div>
    <div id="td-controls-${stKey}" class="td-reveal-bar">
      <button id="td-btn-${stKey}" class="td-btn" style="border-color:#5a9a38;color:#8ac050;background:rgba(90,154,56,0.15)" data-td-action="next" data-td-key="${stKey}" data-td-total="${totalSteps}">Next Round ▸</button>
      <button class="td-btn td-btn-reveal-all" data-td-action="all" data-td-key="${stKey}" data-td-total="${totalSteps}">Reveal All ▸▸</button>
      <span id="td-counter-${stKey}" style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:700;color:#8ac050">${Math.max(0, st.idx + 1)}/${totalSteps}</span>
    </div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders[stKey] = rpBuildTopDogForest;
  return _shell(content, ep, 'td-forest');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 6: WINNER
// ══════════════════════════════════════════════════════════════
export function rpBuildTopDogWinner(ep) {
  const data = ep.topDog;
  if (!data) return '<div>No challenge data</div>';

  const winner = data.immunityWinner;
  const finishOrder = data.phase2?.finishOrder || [];
  const assignments = data.phase1?.assignments || [];
  const performances = data.phase1?.performances || [];
  const scores = ep.chalMemberScores || {};

  // Find winner's animal
  const winnerAssign = assignments.find(a => a.player === winner);
  const winnerAnimal = winnerAssign?.animal || { name: '?', icon: '?' };
  const winnerSlug = slug(winner);

  // Build leaderboard sorted by total score (winner guaranteed #1)
  const ranked = [...finishOrder].sort((a, b) => {
    if (a === winner) return -1;
    if (b === winner) return 1;
    return (scores[b] || 0) - (scores[a] || 0);
  });
  let leaderboard = ranked.map((n, i) => {
    const isWinner = n === winner;
    const totalScore = scores[n] || 0;

    return `<div class="td-lb-row ${isWinner ? 'td-first' : ''}" style="${isWinner ? '' : 'background:rgba(168,216,200,0.05)'}">
      <span class="td-lb-rank">#${i + 1}</span>
      ${_poster(n, isWinner ? 'td-winner-p' : 'td-high')}
      <span class="td-lb-name">${n}</span>
      <span class="td-lb-score">${totalScore} pts</span>
      ${isWinner ? '<span style="font-size:0.6rem;font-weight:700;padding:1px 6px;border-radius:3px;background:rgba(184,134,11,0.15);color:#8a6a00;font-family:Inter,sans-serif;text-transform:uppercase;letter-spacing:1px">IMMUNE</span>' : ''}
    </div>`;
  }).join('');

  const content = `
    <div style="text-align:center;margin:12px 0">
      <div style="font-family:'Inter',sans-serif;font-size:0.8rem;font-weight:800;color:var(--pet-muted);letter-spacing:3px;margin-bottom:6px;text-transform:uppercase">FIRST TO THE FINISH</div>
      <div class="td-h1" style="font-size:1.8rem;color:#a08020">BEST IN SHOW</div>
      <div style="margin:14px auto;width:90px;height:90px;border-radius:50%;border:4px solid #e8c050;overflow:hidden;position:relative;box-shadow:0 0 20px rgba(232,192,80,0.3)">
        <img src="assets/avatars/${winnerSlug}.png" alt="${winner}" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'">
        <div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,rgba(232,192,80,0.15),transparent 50%);pointer-events:none"></div>
      </div>
      <div style="font-family:'Inter',sans-serif;font-size:1.3rem;font-weight:800;color:#a08020;margin:6px 0">${winner}</div>
      <div style="font-family:'Inter',sans-serif;font-size:1rem;font-weight:600;color:var(--pet-brown);margin:4px 0">${_icon('heart')} with ${winnerAnimal.name}</div>
      <div style="font-size:0.82rem;color:var(--pet-muted);margin-top:4px;font-style:italic">${data.phase2.finishText || ''}</div>
    </div>
    <div class="td-h2" style="text-align:center">Final Leaderboard</div>
    <div style="max-width:500px;margin:0 auto">${leaderboard}</div>`;

  if (!window._tdScreenBuilders) window._tdScreenBuilders = {};
  window._tdScreenBuilders['td-winner'] = rpBuildTopDogWinner;
  return _shell(content, ep, 'td-winner');
}

// js/chal/super-hero-ld.js — Super Hero-ld superhero challenge (post-merge)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';

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
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}

// ══════════════════════════════════════════════════════════════
// HERO GENERATION
// ══════════════════════════════════════════════════════════════
const POWER_TYPES = {
  strength: { icon: '💪', color: '#ef4444', glow: 'rgba(239,68,68,0.3)', names: ['The Unstoppable Fridge', 'Major Muscles', 'Iron Gut', 'The Human Wrecking Ball', 'Titanium Tornado', 'Mega Punch'], powers: ['super strength', 'can bench-press a bus', 'unbreakable fists', 'earthquake stomp'] },
  psychic: { icon: '🧠', color: '#a855f7', glow: 'rgba(168,85,247,0.3)', names: ['Mind Melter', 'Professor Brainwave', 'The Thought Thief', 'Cerebro Kid', 'Neuro Knight', 'Psy-Clone'], powers: ['telekinesis', 'mind reading', 'psychic blast', 'brain freeze ray'] },
  speed: { icon: '⚡', color: '#eab308', glow: 'rgba(234,179,8,0.3)', names: ['Lightning Lad', 'Blur Girl', 'Speed Demon', 'The Flash Bang', 'Sonic Streak', 'Velocity Viper'], powers: ['super speed', 'time slow-down', 'afterimage clones', 'sonic boom'] },
  charm: { icon: '✨', color: '#ec4899', glow: 'rgba(236,72,153,0.3)', names: ['Captain Charisma', 'The Enchantress', 'Hypno Heart', 'Glamour Girl', 'The Silver Tongue', 'Charm Bomb'], powers: ['mind control', 'hypnotic voice', 'emotional manipulation', 'charm aura'] },
  fire: { icon: '🔥', color: '#f97316', glow: 'rgba(249,115,22,0.3)', names: ['Inferno', 'Blaze Master', 'The Human Torch 2.0', 'Pyro Punk', 'Flame Fist', 'Burninator'], powers: ['fire blasts', 'heat vision', 'spontaneous combustion', 'flame shield'] },
  gadgets: { icon: '🔧', color: '#06b6d4', glow: 'rgba(6,182,212,0.3)', names: ['Gadget Guy', 'Tech-Tonic', 'The Inventor', 'Widget Woman', 'Hack Attack', 'Circuit Breaker'], powers: ['utility belt', 'gadget arm', 'drone swarm', 'EMP pulse'] },
  tank: { icon: '🛡️', color: '#22c55e', glow: 'rgba(34,197,94,0.3)', names: ['The Wall', 'Fortress', 'Shield Bearer', 'Rock Solid', 'Iron Hide', 'Bunker Boy'], powers: ['invulnerability', 'force field', 'regeneration', 'damage absorption'] },
};

const ORIGIN_STORIES = {
  villain: [n => `${n} was bitten by a radioactive ego. The power went straight to ${pronouns(n).posAdj} head.`],
  mastermind: [n => `${n} built the suit in a cave. With a box of scraps. And an evil plan.`],
  schemer: [n => `${n}'s power awakened during a particularly devious scheme. Convenient.`],
  hero: [n => `${n} gained powers after saving a bus full of orphans. Obviously.`],
  'loyal-soldier': [n => `${n} volunteered for the super-soldier program. First in line.`],
  'social-butterfly': [n => `${n}'s power manifested at a party. The BEST party.`],
  'challenge-beast': [n => `${n} was already superhuman. The costume is just for show.`],
  hothead: [n => `${n}'s powers activate when angry. Which is always.`],
  wildcard: [n => `${n} got powers from a vending machine. Nobody knows how.`],
  'chaos-agent': [n => `${n}'s powers are unpredictable. Even to ${pronouns(n).obj}.`],
  floater: [n => `${n} may or may not have powers. Nobody's checked.`],
  underdog: [n => `${n} was told ${pronouns(n).sub} would never be a hero. Watch this.`],
  goat: [n => `${n} found the costume in a dumpster. It still smells.`],
  'perceptive-player': [n => `${n} sees everything. EVERYTHING. It's unsettling.`],
  showmancer: [n => `${n}'s powers only work when someone cute is watching.`],
};

const CATCHPHRASES = [
  'It\'s hero time!', 'You won\'t like me when I\'m SUPER.', 'Justice never sleeps!',
  'Fear my SPANDEX!', 'With great power comes great... me.', 'I didn\'t choose the cape life.',
  'KAPOW! ...Did that work?', 'Evil doesn\'t stand a chance. Probably.',
  'My lawyer says I\'m legally a hero.', 'Is this thing on?',
];

const POWER_DEMO_TEXT = {
  strength: [
    (p, pr) => `${p} punched a prop wall. It shattered. ${host()} looked at the budget sheet and winced.`,
    (p, pr) => `${p} lifted Chef over ${pr.posAdj} head. Chef was not amused. The crowd was.`,
  ],
  psychic: [
    (p, pr) => `${p} "read" ${host()}'s mind. "You're thinking about... hair gel." ${host()}: "...Lucky guess."`,
    (p, pr) => `${p} stared at a prop boulder, pretending to move it with ${pr.posAdj} mind. It didn't move. "It's shy."`,
  ],
  speed: [
    (p, pr) => `${p} sprinted across the set so fast ${pr.posAdj} cape flew off. Into Chef's face.`,
    (p, pr) => `${p} ran in circles creating a "tornado." Really just got dizzy and fell over.`,
  ],
  charm: [
    (p, pr) => `${p} used "mind control" on ${host()}. "Give me immunity." ${host()}: "Nice try."`,
    (p, pr) => `${p} winked at the camera. Three interns fainted. Allegedly.`,
  ],
  fire: [
    (p, pr) => `${p} shot "fire" from ${pr.posAdj} hands. It was a lighter taped to ${pr.posAdj} glove. Still impressive.`,
    (p, pr) => `${p}'s "heat vision" was just squinting really hard. The sun did the rest.`,
  ],
  gadgets: [
    (p, pr) => `${p} pulled out a grappling hook. It worked! Then the rope snapped. "Prototype."`,
    (p, pr) => `${p} activated ${pr.posAdj} "drone swarm." One RC helicopter flew into a tree.`,
  ],
  tank: [
    (p, pr) => `${p} let Chef throw a bowling ball at ${pr.obj}. ${p} caught it. Then dropped it on ${pr.posAdj} foot.`,
    (p, pr) => `${p} walked through a prop wall. The wall was cardboard but the confidence was real.`,
  ],
};

function generateHero(name) {
  const s = pStats(name);
  const pr = pronouns(name);
  const a = arch(name);
  // Determine power type from highest stat
  const statMap = [
    ['strength', s.physical], ['psychic', s.mental], ['speed', s.intuition],
    ['charm', s.social], ['fire', s.boldness], ['gadgets', s.strategic], ['tank', s.endurance],
  ];
  statMap.sort((a, b) => b[1] - a[1] + noise(0.3));
  const powerType = statMap[0][0];
  const pt = POWER_TYPES[powerType];
  const heroName = pick(pt.names);
  const power = pick(pt.powers);
  const origin = (ORIGIN_STORIES[a] || ORIGIN_STORIES.floater)[0](name);
  const catchphrase = pick(CATCHPHRASES);
  return { name, heroName, powerType, power, origin, catchphrase, icon: pt.icon, color: pt.color, glow: pt.glow };
}

// ══════════════════════════════════════════════════════════════
// VILLAIN SABOTAGE
// ══════════════════════════════════════════════════════════════
const SABOTAGE_TEXT = {
  costume: [
    (p, pr) => `Dander Boy scratched ${p}'s costume to shreds! ${p}: "That CAT is EVIL!"`,
    (p, pr) => `Pythonicus swapped ${p}'s fabric for toilet paper. "That's not spandex..."`,
    (p, pr) => `Pythonicus electrified ${p}'s sewing machine! ZAP! The costume has burn marks now.`,
    (p, pr) => `Dander Boy sat on ${p}'s cape and refused to move. ${p} lost precious time.`,
  ],
  costumeDodge: [
    (p, pr) => `Pythonicus lunged at ${p}'s costume but ${p} saw it coming and blocked. "NOT TODAY!"`,
    (p, pr) => `Dander Boy tried to scratch ${p}'s outfit but ${p} sprayed water. Cat defeated.`,
  ],
  obstacle: [
    (p, pr) => `Pythonicus aimed a bowling ball RIGHT at ${p}! Direct hit! Time added!`,
    (p, pr) => `Dander Boy ran across the track in front of ${p}! ${p} tripped over the cat!`,
    (p, pr) => `Pythonicus loosened the trampoline springs before ${p}'s turn! Weak bounce!`,
  ],
  obstacleDodge: [
    (p, pr) => `Pythonicus threw a bowling ball at ${p} but ${p} dodged it Matrix-style!`,
    (p, pr) => `Dander Boy tried to trip ${p} but ${p} hurdled the cat cleanly!`,
  ],
};

// ══════════════════════════════════════════════════════════════
// COSTUME CONTEST JUDGING
// ══════════════════════════════════════════════════════════════
const CHRIS_JUDGE_TEXT = {
  great: [
    (h, p, hero, score) => `${h} whistled. "${hero.heroName}? ${hero.power}? ${score}/10. I'm IMPRESSED."`,
    (h, p, hero, score) => `"Now THAT'S a superhero!" ${h} gave ${hero.heroName} a ${score}/10. "${p} gets it."`,
  ],
  good: [
    (h, p, hero, score) => `${h} nodded. "${hero.heroName}. Solid. ${score}/10."`,
    (h, p, hero, score) => `"Not bad, ${p}. ${hero.power} is creative." ${h} scribbled ${score}/10.`,
  ],
  mid: [
    (h, p, hero, score) => `${h} squinted. "${hero.heroName}? Really? ${score}/10."`,
    (h, p, hero, score) => `"It's... fine." ${h} shrugged. ${score}/10 for ${hero.heroName}.`,
  ],
  bad: [
    (h, p, hero, score) => `${h} covered his eyes. "${hero.heroName}? That's not a hero, that's a HR violation. ${score}/10."`,
    (h, p, hero, score) => `"What IS that?" ${h} stared at ${p}'s costume. ${score}/10. Generous.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// OBSTACLE COURSE TEXT
// ══════════════════════════════════════════════════════════════
const OBSTACLE_TEXT = {
  jumpPass: [
    (p, pr) => `${p} launched off the trampoline, SOARED over the building, and stuck the landing! HEROIC!`,
    (p, pr) => `${p} flew! Actually flew! ...For about two seconds. But the landing was perfect.`,
    (p, pr) => `${p} cleared the building with room to spare. The cape fluttered majestically.`,
  ],
  jumpFail: [
    (p, pr) => `${p} hit the trampoline wrong and smacked face-first into the building. SPLAT.`,
    (p, pr) => `${p} barely got any height. Crashed into the building's second floor window.`,
    (p, pr) => `${p}'s cape got caught on the trampoline. Flung backward instead of forward.`,
  ],
  rescuePass: [
    (p, pr) => `${p} grabbed the potato sack girl and kept running! "I'LL SAVE YOU!"`,
    (p, pr) => `${p} scooped up the "damsel" in one motion. Smooth superhero rescue.`,
    (p, pr) => `${p} dove for the potato sack and rolled back to ${pr.posAdj} feet with it. Action hero stuff.`,
  ],
  rescueFail: [
    (p, pr) => `${p} ran right past the potato sack. "WHERE'S THE GIRL?!" It was behind ${pr.obj}.`,
    (p, pr) => `${p} tripped on the potato sack and went flying. The "girl" was unimpressed.`,
    (p, pr) => `${p} picked up the wrong sack. That was just regular potatoes. "...Close enough?"`,
  ],
  meteorPass: [
    (p, pr) => `Bowling balls rained down but ${p} weaved through them all! Untouched!`,
    (p, pr) => `${p} dodged Chef's bowling balls like a superhero dodging asteroids!`,
    (p, pr) => `${p} used ${pr.posAdj} "super reflexes" to dodge every single bowling ball. Actually impressive.`,
  ],
  meteorFail: [
    (p, pr) => `BONK! Bowling ball right to ${p}'s head. ${pr.Sub} saw stars. Real ones.`,
    (p, pr) => `${p} got nailed by THREE bowling balls. Chef was enjoying this way too much.`,
    (p, pr) => `${p} tried to catch a bowling ball. Bad idea. Very bad idea.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// DRAMA BREAK EVENTS
// ══════════════════════════════════════════════════════════════
const HERO_DRAMA = [
  {
    id: 'alliancePitch',
    check(all) { return all.length >= 3; },
    apply(all, ep) {
      const pitcher = all.find(n => pStats(n).strategic >= 5) || pick(all);
      const targets = all.filter(n => n !== pitcher).sort(() => Math.random() - 0.5).slice(0, 2);
      const accepted = (pStats(pitcher).social * 0.04 + pStats(pitcher).strategic * 0.03 + noise(0.3)) > 0.28;
      if (accepted) {
        targets.forEach(t => addBond(pitcher, t, 0.4));
        return { text: `${pitcher} pulled ${targets.join(' and ')} aside in the costume room. "We need to stick together. The strong players are coming for us." Nods all around.`, players: [pitcher, ...targets], badgeText: 'PACT FORMED', badgeClass: 'green' };
      }
      return { text: `${pitcher} tried to pitch ${targets.join(' and ')} on working together. Awkward silence. "We'll think about it."`, players: [pitcher, ...targets], badgeText: 'PITCH FAILED', badgeClass: 'red' };
    },
  },
  {
    id: 'heroNameMock',
    check(all) { return all.length >= 2; },
    apply(all, ep) {
      const heroes = ep.superHerold?.heroes || {};
      const mocker = pick(all);
      const target = pick(all.filter(n => n !== mocker));
      if (!heroes[mocker] || !heroes[target]) return null;
      addBond(mocker, target, -0.3);
      return { text: `"${heroes[target].heroName}?!" ${mocker} burst out laughing. "That's the worst superhero name I've ever heard." ${target} was NOT amused.`, players: [mocker, target], badgeText: 'HERO SHADE', badgeClass: 'red' };
    },
  },
  {
    id: 'costumeCompliment',
    check(all) { return all.length >= 2; },
    apply(all, ep) {
      const pair = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      addBond(pair[0], pair[1], 0.3);
      return { text: `${pair[0]} admired ${pair[1]}'s costume. "OK, that actually looks amazing." Respect between heroes.`, players: [pair[0], pair[1]], badgeText: 'COSTUME RESPECT', badgeClass: 'green' };
    },
  },
  {
    id: 'showmanceSpandex',
    check(all) { return gs.showmances?.some(s => all.includes(s.a) && all.includes(s.b)); },
    apply(all, ep) {
      const sm = gs.showmances.find(s => all.includes(s.a) && all.includes(s.b));
      if (!sm) return null;
      addBond(sm.a, sm.b, 0.3);
      return { text: `${sm.a} caught ${sm.b} staring at them in spandex. "What?" "Nothing. You look... heroic." The tension was THICK.`, players: [sm.a, sm.b], badgeText: 'SPANDEX MOMENT', badgeClass: 'green' };
    },
  },
  {
    id: 'villainReaction',
    check(all) { return true; },
    apply(all, ep) {
      const target = pick(all);
      popDelta(target, -1);
      return { text: `${host()} pointed at ${target}. "By the way, your costume? Pythonicus has better fashion sense. And he's a SNAKE."`, players: [target], badgeText: 'HOST BURN', badgeClass: 'amber' };
    },
  },
  {
    id: 'powerPractice',
    check(all) { return all.length >= 2; },
    apply(all, ep) {
      const heroes = ep.superHerold?.heroes || {};
      const player = pick(all.filter(n => heroes[n]));
      if (!player) return null;
      const hero = heroes[player];
      const pr = pronouns(player);
      const demoText = POWER_DEMO_TEXT[hero.powerType] ? pick(POWER_DEMO_TEXT[hero.powerType])(player, pr) : `${player} tried to demonstrate ${hero.power}. It did not go well.`;
      return { text: demoText, players: [player], badgeText: 'POWER DEMO', badgeClass: 'amber' };
    },
  },
  {
    id: 'rivalryEscalate',
    check(all) {
      for (const a of all) for (const b of all) if (a !== b && getBond(a, b) < -2) return true;
      return false;
    },
    apply(all, ep) {
      const pairs = [];
      for (const a of all) for (const b of all) if (a !== b && getBond(a, b) < -2) pairs.push([a, b]);
      if (!pairs.length) return null;
      const [a, b] = pick(pairs);
      addBond(a, b, -0.3);
      return { text: `${a} and ${b} got into it during the break. "YOUR power is fake!" "YOUR FACE is fake!" Capes were almost torn.`, players: [a, b], badgeText: 'HERO VS HERO', badgeClass: 'red' };
    },
  },
  {
    id: 'confessional',
    check(all) { return true; },
    apply(all, ep) {
      const p = pick(all);
      const texts = [
        `${p}: "I look ridiculous in spandex. But somehow... I feel POWERFUL."`,
        `${p}: "If my parents saw me in this costume, they'd disown me. Worth it."`,
        `${p}: "${host()} thinks these powers are fake? Mine are VERY real. ...Probably."`,
        `${p}: "The cape keeps getting stuck in things. How does Batman DO this?"`,
      ];
      return { text: pick(texts), players: [p], badgeText: 'CONFESSIONAL', badgeClass: 'amber' };
    },
  },
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateSuperHerold(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    heroes: {},
    costumeContest: { events: [], winner: null },
    obstacleCourse: { events: [], results: {}, winner: null },
    breakEvents: [],
  };

  // Generate hero identities
  for (const name of active) {
    result.heroes[name] = generateHero(name);
  }

  // ── PHASE 1: COSTUME CONTEST ──
  _simulateCostumeContest(active, result, ep, campKey);

  // ── SUPERHERO BREAK ──
  _simulateHeroBreak(active, result, ep, campKey);

  // ── PHASE 2: OBSTACLE COURSE ──
  _simulateObstacleCourse(active, result, ep, campKey);

  // ── FINALIZE ──
  ep.superHerold = result;
  ep.isOperationClassified = false;
  ep.isSuperHerold = true;
  ep.challengeType = 'super-hero-ld';
  ep.challengeLabel = 'Super Hero-ld';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = result.obstacleCourse.winner;
  ep.chalPlacements = Object.entries(result.obstacleCourse.results)
    .sort((a, b) => a[1].finalTime - b[1].finalTime)
    .map(([name]) => name);
  ep.tribalPlayers = active;

  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = {
    type: 'super-hero-ld', label: 'Super Hero-ld',
    winner: result.obstacleCourse.winner,
  };

  return ep;
}

function _simulateCostumeContest(active, result, ep, campKey) {
  const cc = result.costumeContest;
  let bestScore = 0;
  let bestPlayer = null;

  for (const name of active) {
    const s = pStats(name);
    const pr = pronouns(name);
    const hero = result.heroes[name];

    // Villain sabotage (~30%)
    let sabotaged = false;
    if (Math.random() < 0.3) {
      const dodgeCheck = s.intuition * 0.03 + s.boldness * 0.02 + noise(0.3);
      if (dodgeCheck > 0.25) {
        cc.events.push({ type: 'sabotage-dodge', player: name, icon: '🛡️',
          text: pick(SABOTAGE_TEXT.costumeDodge)(name, pr) });
      } else {
        sabotaged = true;
        cc.events.push({ type: 'sabotage-hit', player: name, icon: '😾',
          text: pick(SABOTAGE_TEXT.costume)(name, pr) });
      }
    }

    // Power demo
    const demoTexts = POWER_DEMO_TEXT[hero.powerType];
    if (demoTexts) {
      cc.events.push({ type: 'demo', player: name, icon: hero.icon,
        text: pick(demoTexts)(name, pr) });
    }

    // Chris judges
    const score = s.social * 0.03 + s.mental * 0.02 + s.boldness * 0.02 + (sabotaged ? -0.08 : 0) + noise(0.35);
    const chrisScore = Math.min(10, Math.max(1, Math.round(score * 12 + 3)));
    hero.chrisScore = chrisScore;
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + chrisScore;

    const judgeLevel = chrisScore >= 8 ? 'great' : chrisScore >= 6 ? 'good' : chrisScore >= 4 ? 'mid' : 'bad';
    cc.events.push({ type: 'judge', player: name, icon: '⭐', score: chrisScore,
      text: pick(CHRIS_JUDGE_TEXT[judgeLevel])(host(), name, hero, chrisScore) });

    if (chrisScore > bestScore) {
      bestScore = chrisScore;
      bestPlayer = name;
    }
  }

  cc.winner = bestPlayer;
  cc.events.push({ type: 'winner', player: bestPlayer, icon: '🏆',
    text: `${host()} declared ${bestPlayer} the winner of the costume contest! -10 seconds on the obstacle course!` });
}

function _simulateHeroBreak(active, result, ep, campKey) {
  const eligible = HERO_DRAMA.filter(ev => ev.check(active));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const target = 5 + Math.floor(Math.random() * 3); // 5-7
  for (const ev of shuffled) {
    if (result.breakEvents.length >= target) break;
    const applied = ev.apply(active, ep);
    if (applied) {
      ep.campEvents[campKey].post.push({ ...applied, tag: 'drama' });
      result.breakEvents.push({ id: ev.id, ...applied });
    }
  }
}

function _simulateObstacleCourse(active, result, ep, campKey) {
  const oc = result.obstacleCourse;
  const costumeWinner = result.costumeContest.winner;
  let bestTime = Infinity;
  let bestPlayer = null;

  // Randomize order
  const order = [...active].sort(() => Math.random() - 0.5);
  for (const name of order) {
    const s = pStats(name);
    const pr = pronouns(name);
    const hero = result.heroes[name];
    let totalTime = 60; // base time
    const obstacles = [];

    // Costume winner bonus
    if (name === costumeWinner) {
      totalTime -= 10;
      oc.events.push({ type: 'bonus', player: name, icon: '⏱️',
        text: `${name} gets -10 seconds for winning the costume contest!` });
    }

    // Obstacle 1: Trampoline Jump
    const jumpCheck = s.physical * 0.03 + s.boldness * 0.02 + noise(0.35);
    const jumpPass = jumpCheck > 0.28;
    if (jumpPass) {
      totalTime -= 10;
      oc.events.push({ type: 'jump-pass', player: name, icon: '🦸', text: pick(OBSTACLE_TEXT.jumpPass)(name, pr) });
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
    } else {
      totalTime += 8;
      oc.events.push({ type: 'jump-fail', player: name, icon: '💥', text: pick(OBSTACLE_TEXT.jumpFail)(name, pr) });
    }
    obstacles.push({ type: 'jump', passed: jumpPass });

    // Obstacle 2: Rescue Potato Sack
    const rescueCheck = s.endurance * 0.03 + s.intuition * 0.02 + noise(0.35);
    const rescuePass = rescueCheck > 0.26;
    if (rescuePass) {
      totalTime -= 8;
      oc.events.push({ type: 'rescue-pass', player: name, icon: '🥔', text: pick(OBSTACLE_TEXT.rescuePass)(name, pr) });
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
    } else {
      totalTime += 6;
      oc.events.push({ type: 'rescue-fail', player: name, icon: '💥', text: pick(OBSTACLE_TEXT.rescueFail)(name, pr) });
    }
    obstacles.push({ type: 'rescue', passed: rescuePass });

    // Obstacle 3: Meteor Shower
    const meteorCheck = s.intuition * 0.04 + s.physical * 0.02 + noise(0.35);
    const meteorPass = meteorCheck > 0.30;
    if (meteorPass) {
      totalTime -= 12;
      oc.events.push({ type: 'meteor-pass', player: name, icon: '🎳', text: pick(OBSTACLE_TEXT.meteorPass)(name, pr) });
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 3;
    } else {
      totalTime += 10;
      oc.events.push({ type: 'meteor-fail', player: name, icon: '💥', text: pick(OBSTACLE_TEXT.meteorFail)(name, pr) });
    }
    obstacles.push({ type: 'meteor', passed: meteorPass });

    // Villain sabotage during course (~25%)
    if (Math.random() < 0.25) {
      const dodgeCheck = s.intuition * 0.03 + s.boldness * 0.02 + noise(0.3);
      if (dodgeCheck > 0.25) {
        oc.events.push({ type: 'sabotage-dodge', player: name, icon: '🛡️',
          text: pick(SABOTAGE_TEXT.obstacleDodge)(name, pr) });
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 1;
      } else {
        totalTime += 8;
        oc.events.push({ type: 'sabotage-hit', player: name, icon: '😾',
          text: pick(SABOTAGE_TEXT.obstacle)(name, pr) });
      }
    }

    // Inline reaction (~40%)
    if (Math.random() < 0.4) {
      const reactor = pick(active.filter(n => n !== name));
      if (reactor) {
        const passCount = obstacles.filter(o => o.passed).length;
        if (passCount >= 3) {
          oc.events.push({ type: 'reaction', players: [reactor, name],
            text: `${reactor} watched ${name}'s run with jaw dropped. "OK, ${result.heroes[name]?.heroName || name} is the REAL DEAL."` });
          addBond(reactor, name, 0.2);
        } else if (passCount === 0) {
          oc.events.push({ type: 'reaction', players: [reactor, name],
            text: `${reactor} winced at ${name}'s run. "That was... painful to watch."` });
        }
      }
    }

    const finalTime = Math.max(15, totalTime);
    oc.results[name] = { obstacles, finalTime, passed: obstacles.filter(o => o.passed).length };

    oc.events.push({ type: 'time', player: name, icon: '⏱️',
      text: `${name} finishes with a time of ${finalTime} seconds!${name === costumeWinner ? ' (includes -10s bonus)' : ''}` });

    if (finalTime < bestTime) {
      bestTime = finalTime;
      bestPlayer = name;
    }
  }

  oc.winner = bestPlayer;
  popDelta(bestPlayer, 2);
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textSuperHerold(ep, ln, sec) {
  const sh = ep.superHerold;
  if (!sh) return;
  sec('SUPER HERO-LD');
  ln(`${host()} announces a superhero challenge. Everyone gets spandex.`);
  ln('── COSTUME CONTEST ──');
  for (const [name, hero] of Object.entries(sh.heroes)) {
    ln(`  ${name} → ${hero.heroName} (${hero.power}) — ${hero.chrisScore}/10`);
  }
  ln(`  Winner: ${sh.costumeContest.winner} (-10s bonus)`);
  if (sh.breakEvents?.length) {
    ln('── SUPERHERO BREAK ──');
    for (const e of sh.breakEvents) ln(`  ${e.badgeText}: ${e.text}`);
  }
  ln('── OBSTACLE COURSE ──');
  for (const e of sh.obstacleCourse.events) ln(`  ${e.icon} ${e.text}`);
  ln(`  IMMUNITY: ${sh.obstacleCourse.winner}`);
}

// ══════════════════════════════════════════════════════════════
// VP — CSS
// ══════════════════════════════════════════════════════════════
function css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Share+Tech+Mono&family=Inter:wght@400;600;700&display=swap');

  .sh-shell{
    --comic-red:#ef4444;--comic-blue:#3b82f6;--comic-yellow:#eab308;
    --comic-black:#1a1a1a;--comic-white:#fef9ef;--comic-green:#22c55e;
    font-family:'Inter',sans-serif;color:var(--comic-black);
    background:var(--comic-white);
    background-image:radial-gradient(circle,rgba(0,0,0,0.03) 1px,transparent 1px);
    background-size:6px 6px;
    padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
    overflow:clip;border:3px solid var(--comic-black);
  }

  /* Layout */
  .sh-layout{display:flex;gap:0;position:relative;z-index:5;min-height:300px}
  .sh-feed{flex:1;padding:14px 18px;min-width:0}
  .sh-sidebar{width:260px;flex-shrink:0;padding:12px 14px;background:rgba(0,0,0,0.03);
    border-left:3px solid var(--comic-black);position:sticky;top:0;align-self:flex-start;max-height:80vh;overflow-y:auto}

  /* HUD */
  .sh-hud{display:flex;justify-content:center;gap:0;padding:10px 0;position:relative;z-index:5;
    border-bottom:3px solid var(--comic-black);background:var(--comic-yellow)}
  .sh-hud-cell{flex:1;text-align:center;padding:4px 12px;border-right:2px solid rgba(0,0,0,0.15)}
  .sh-hud-cell:last-child{border-right:none}
  .sh-hud-val{font-family:'Bangers',cursive;font-size:22px;color:var(--comic-black)}
  .sh-hud-lbl{font-size:9px;letter-spacing:2px;color:rgba(0,0,0,0.5);text-transform:uppercase;font-family:'Share Tech Mono',monospace}

  /* Comic panel */
  .sh-panel{background:#fff;border:3px solid var(--comic-black);border-radius:2px;margin:8px 0;padding:12px;position:relative;
    box-shadow:4px 4px 0 rgba(0,0,0,0.1)}
  .sh-panel-action{transform:rotate(-0.5deg)}
  .sh-panel-impact{animation:sh-panel-slam 0.4s cubic-bezier(0.22,1,0.36,1)}
  @keyframes sh-panel-slam{0%{transform:scale(1.3) rotate(-2deg);opacity:0}50%{transform:scale(1.02) rotate(0.5deg)}100%{transform:scale(1) rotate(0)}}

  /* Speech bubble */
  .sh-bubble{position:relative;background:#fff;border:2px solid var(--comic-black);border-radius:12px;padding:8px 12px;
    margin:6px 0;font-size:12px;line-height:1.5}
  .sh-bubble::after{content:'';position:absolute;bottom:-8px;left:20px;width:0;height:0;
    border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid var(--comic-black)}
  .sh-bubble-inner::after{content:'';position:absolute;bottom:-6px;left:21px;width:0;height:0;
    border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid #fff}

  /* Caption box (narrator) */
  .sh-caption{background:var(--comic-yellow);border:2px solid var(--comic-black);padding:6px 10px;
    font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px;margin:6px 0;display:inline-block}

  /* Action words */
  .sh-action-word{font-family:'Bangers',cursive;font-size:28px;letter-spacing:3px;text-transform:uppercase;
    display:inline-block;padding:4px 12px;transform:rotate(-3deg);
    text-shadow:2px 2px 0 rgba(0,0,0,0.15);animation:sh-kapow 0.5s cubic-bezier(0.22,1,0.36,1)}
  @keyframes sh-kapow{0%{transform:scale(0) rotate(-15deg)}60%{transform:scale(1.3) rotate(3deg)}100%{transform:scale(1) rotate(-3deg)}}

  /* Hero card */
  .sh-hero-card{display:flex;gap:0;border:3px solid var(--comic-black);border-radius:4px;overflow:hidden;
    background:#fff;margin:8px 0;box-shadow:4px 4px 0 rgba(0,0,0,0.1)}
  .sh-hero-photo{width:90px;flex-shrink:0;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .sh-hero-photo img{width:100%;height:auto;object-fit:contain;position:relative;z-index:2}
  /* Costume glow overlay */
  .sh-hero-glow{position:absolute;inset:0;z-index:1;opacity:0.3}
  /* Mask overlay */
  .sh-hero-mask{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:3;
    width:40px;height:16px;border-radius:50%;border:2px solid rgba(0,0,0,0.4);background:rgba(0,0,0,0.15)}
  .sh-hero-data{flex:1;padding:10px 14px;display:flex;flex-direction:column;gap:3px}
  .sh-hero-name{font-family:'Bangers',cursive;font-size:20px;letter-spacing:2px;color:var(--comic-black);line-height:1}
  .sh-hero-real{font-size:10px;color:rgba(0,0,0,0.4);font-family:'Share Tech Mono',monospace}
  .sh-hero-power{font-size:11px;color:rgba(0,0,0,0.7);margin-top:2px}
  .sh-hero-origin{font-size:10px;color:rgba(0,0,0,0.5);font-style:italic;margin-top:2px;line-height:1.3}
  .sh-hero-score{font-family:'Bangers',cursive;font-size:18px;margin-top:4px}

  /* Speed lines */
  .sh-speed-lines{position:relative;overflow:hidden}
  .sh-speed-lines::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(0,0,0,0.02) 8px,rgba(0,0,0,0.02) 9px);
    animation:sh-speed 0.8s linear infinite}
  @keyframes sh-speed{0%{background-position:0 0}100%{background-position:-9px 0}}

  /* Sidebar */
  .sh-side-sec{font-family:'Bangers',cursive;font-size:14px;letter-spacing:2px;
    color:var(--comic-black);padding:6px 0 4px;border-bottom:2px solid rgba(0,0,0,0.1);margin-top:8px}
  .sh-side-sec:first-child{margin-top:0}

  /* Controls */
  .sh-controls{display:flex;gap:10px;justify-content:center;padding:16px 0;position:relative;z-index:5}
  .sh-btn-next{padding:10px 24px;font-family:'Bangers',cursive;font-size:16px;letter-spacing:3px;
    background:var(--comic-red);color:#fff;border:3px solid var(--comic-black);
    border-radius:4px;cursor:pointer;text-transform:uppercase;transition:all 0.2s;
    box-shadow:3px 3px 0 rgba(0,0,0,0.2)}
  .sh-btn-next:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 rgba(0,0,0,0.25)}
  .sh-btn-all{padding:10px 18px;font-size:12px;background:#fff;color:rgba(0,0,0,0.5);
    border:2px solid rgba(0,0,0,0.2);border-radius:4px;cursor:pointer;font-family:'Share Tech Mono',monospace}

  /* Event rows */
  .sh-event-good{border-left:4px solid var(--comic-green);padding-left:8px;margin:4px 0}
  .sh-event-bad{border-left:4px solid var(--comic-red);padding-left:8px;margin:4px 0}
  .sh-event-neutral{border-left:4px solid var(--comic-yellow);padding-left:8px;margin:4px 0}

  @media(prefers-reduced-motion:reduce){
    .sh-panel-impact,.sh-action-word,.sh-speed-lines::before{animation:none!important}
  }
  </style>`;
}

// ══════════════════════════════════════════════════════════════
// VP — SHELL + SCREENS
// ══════════════════════════════════════════════════════════════
function _shShell(content, ep) {
  return `${css()}<div class="sh-shell">${content}</div>`;
}

export function rpBuildSuperHeroldTitleCard(ep) {
  const sh = ep.superHerold;
  if (!sh) return '';
  const heroCards = Object.entries(sh.heroes).map(([name, hero]) => {
    const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
    return `<div class="sh-hero-card sh-panel-impact" style="max-width:400px;margin:6px auto">
      <div class="sh-hero-photo">
        <div class="sh-hero-glow" style="background:radial-gradient(circle,${hero.glow},transparent 70%)"></div>
        <img src="assets/avatars/${slug}.png" onerror="this.style.display='none'" alt="${name}">
      </div>
      <div class="sh-hero-data">
        <div class="sh-hero-name" style="color:${hero.color}">${hero.icon} ${hero.heroName}</div>
        <div class="sh-hero-real">${name}</div>
        <div class="sh-hero-power">Power: ${hero.power}</div>
        <div class="sh-hero-origin">${hero.origin}</div>
        <div class="sh-bubble" style="margin-top:6px;font-style:italic;font-size:11px">"${hero.catchphrase}"</div>
      </div>
    </div>`;
  }).join('');

  return _shShell(`
    <div style="text-align:center;padding:30px 20px;position:relative;z-index:6">
      <div style="font-family:'Bangers',cursive;font-size:44px;color:var(--comic-red);letter-spacing:4px;
        text-shadow:3px 3px 0 var(--comic-yellow),6px 6px 0 rgba(0,0,0,0.1);line-height:1">SUPER HERO-LD</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:3px;color:rgba(0,0,0,0.4);margin-top:8px">A ${host().toUpperCase()} PRODUCTION</div>
      <div class="sh-caption" style="margin-top:16px">COSTUME CONTEST · OBSTACLE COURSE · VILLAIN SABOTAGE</div>
    </div>
    <div style="padding:0 16px 20px">${heroCards}</div>
  `, ep);
}

export function rpBuildSuperHeroldCostume(ep) {
  const sh = ep.superHerold;
  if (!sh) return '';
  const cc = sh.costumeContest;
  const stateKey = 'sh-costume';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];
  // Group events by player — hero card reveal + sabotage + demo + judge
  const playerOrder = Object.keys(sh.heroes);
  for (const name of playerOrder) {
    const hero = sh.heroes[name];
    const playerEvents = cc.events.filter(e => e.player === name);
    const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');

    let html = `<div class="sh-panel sh-panel-impact">
      <div class="sh-hero-card" style="border:none;box-shadow:none">
        <div class="sh-hero-photo">
          <div class="sh-hero-glow" style="background:radial-gradient(circle,${hero.glow},transparent 70%)"></div>
          <div class="sh-hero-mask" style="border-color:${hero.color}"></div>
          <img src="assets/avatars/${slug}.png" onerror="this.style.display='none'" alt="${name}">
        </div>
        <div class="sh-hero-data">
          <div class="sh-hero-name" style="color:${hero.color}">${hero.icon} ${hero.heroName}</div>
          <div class="sh-hero-real">${name}</div>
          <div class="sh-hero-power">Power: ${hero.power}</div>
        </div>
      </div>`;

    for (const ev of playerEvents) {
      const isGood = ev.type === 'sabotage-dodge' || (ev.type === 'judge' && ev.score >= 7);
      const isBad = ev.type === 'sabotage-hit' || (ev.type === 'judge' && ev.score <= 3);
      const cls = isGood ? 'sh-event-good' : isBad ? 'sh-event-bad' : 'sh-event-neutral';
      if (ev.type === 'judge') {
        const stars = '⭐'.repeat(Math.min(5, Math.ceil(ev.score / 2)));
        html += `<div class="${cls}" style="margin-top:6px">
          <div class="sh-hero-score" style="color:${ev.score >= 7 ? 'var(--comic-green)' : ev.score <= 3 ? 'var(--comic-red)' : 'var(--comic-yellow)'}">${stars} ${ev.score}/10</div>
          <div style="font-size:12px;color:rgba(0,0,0,0.6)">${ev.text}</div>
        </div>`;
      } else {
        html += `<div class="${cls}"><span>${ev.icon} ${ev.text}</span></div>`;
      }
    }
    html += `</div>`;
    steps.push({ html });
  }

  // Winner announcement
  const winner = cc.winner;
  steps.push({ html: `<div class="sh-panel" style="text-align:center;background:var(--comic-yellow)">
    <div class="sh-action-word" style="color:var(--comic-red)">WINNER!</div>
    <div style="font-family:'Bangers',cursive;font-size:22px;margin-top:8px">${sh.heroes[winner]?.heroName || winner}</div>
    <div style="font-size:12px;color:rgba(0,0,0,0.5);margin-top:4px">${winner} wins the costume contest! -10 seconds on the obstacle course!</div>
  </div>` });

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="sh-step-costume-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="sh-controls-costume" class="sh-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="sh-btn-next" onclick="superHeroldRevealNext('sh-costume',${totalSteps})">REVEAL!</button>
    <button class="sh-btn-all" onclick="superHeroldRevealAll('sh-costume',${totalSteps})">Reveal All</button>
  </div>
  <div id="sh-done-costume" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    <div class="sh-caption">COSTUME CONTEST COMPLETE</div>
  </div>`;

  return _shShell(`
    <div class="sh-hud">
      <div class="sh-hud-cell"><div class="sh-hud-val">🦸</div><div class="sh-hud-lbl">COSTUME</div></div>
      <div class="sh-hud-cell"><div class="sh-hud-val">${Object.keys(sh.heroes).length}</div><div class="sh-hud-lbl">HEROES</div></div>
      <div class="sh-hud-cell"><div class="sh-hud-val">I</div><div class="sh-hud-lbl">PHASE</div></div>
    </div>
    <div class="sh-layout">
      <div class="sh-feed">${feed}${controls}</div>
      <div class="sh-sidebar" id="sh-sidebar-costume">
        <div class="sh-side-sec">HEROES</div>
        ${Object.entries(sh.heroes).map(([n, h]) => `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px">
          ${portrait(n, 20)}<span style="color:${h.color};font-family:'Bangers',cursive">${h.heroName}</span>
        </div>`).join('')}
      </div>
    </div>
  `, ep);
}

export function rpBuildSuperHeroldBreak(ep) {
  const sh = ep.superHerold;
  if (!sh || !sh.breakEvents?.length) return '';
  const stateKey = 'sh-break';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];
  steps.push({ html: `<div class="sh-panel" style="text-align:center">
    <div class="sh-action-word" style="color:var(--comic-blue);font-size:22px">MEANWHILE...</div>
    <div class="sh-caption" style="margin-top:8px">Between costume contest and obstacle course, drama unfolds...</div>
  </div>` });

  for (const ev of sh.breakEvents) {
    const badgeColor = ev.badgeClass === 'red' ? 'var(--comic-red)' : ev.badgeClass === 'green' ? 'var(--comic-green)' : 'var(--comic-yellow)';
    steps.push({ html: `<div class="sh-panel">
      <div class="sh-caption" style="background:${badgeColor};color:#fff;border-color:${badgeColor}">${ev.badgeText}</div>
      <div style="display:flex;align-items:flex-start;gap:8px;margin-top:8px">
        <div style="display:flex;gap:3px">${(ev.players || []).map(n => portrait(n, 28)).join('')}</div>
        <div class="sh-bubble" style="flex:1;font-style:italic">${ev.text}</div>
      </div>
    </div>` });
  }

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="sh-step-break-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="sh-controls-break" class="sh-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="sh-btn-next" onclick="superHeroldRevealNext('sh-break',${totalSteps})">NEXT!</button>
    <button class="sh-btn-all" onclick="superHeroldRevealAll('sh-break',${totalSteps})">Reveal All</button>
  </div>`;

  return _shShell(`
    <div class="sh-hud"><div class="sh-hud-cell"><div class="sh-hud-val">💬</div><div class="sh-hud-lbl">DRAMA</div></div></div>
    <div class="sh-layout">
      <div class="sh-feed">${feed}${controls}</div>
      <div class="sh-sidebar"><div class="sh-side-sec">BREAK</div><div style="font-size:10px;color:rgba(0,0,0,0.4)">The heroes take a breather...</div></div>
    </div>
  `, ep);
}

export function rpBuildSuperHeroldObstacle(ep) {
  const sh = ep.superHerold;
  if (!sh) return '';
  const oc = sh.obstacleCourse;
  const stateKey = 'sh-obstacle';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];
  // Group events by player
  const playerOrder = Object.keys(oc.results);
  for (const name of playerOrder) {
    const res = oc.results[name];
    const hero = sh.heroes[name];
    const playerEvents = oc.events.filter(e => e.player === name || (e.players && e.players.includes(name)));

    let html = `<div class="sh-panel sh-speed-lines sh-panel-impact">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${portrait(name, 36)}
        <div>
          <div style="font-family:'Bangers',cursive;font-size:18px;color:${hero?.color || '#333'}">${hero?.heroName || name}</div>
          <div style="font-size:10px;color:rgba(0,0,0,0.4)">${name}</div>
        </div>
      </div>`;

    for (const ev of playerEvents) {
      if (ev.type === 'reaction') {
        html += `<div class="sh-bubble" style="font-size:11px;font-style:italic;margin:4px 0">${ev.text}</div>`;
        continue;
      }
      const isPass = ev.type.includes('pass') || ev.type === 'sabotage-dodge' || ev.type === 'bonus';
      const isFail = ev.type.includes('fail') || ev.type === 'sabotage-hit';
      if (isFail) {
        html += `<div class="sh-event-bad"><span class="sh-action-word" style="font-size:16px;color:var(--comic-red)">${ev.type.includes('meteor') ? 'BONK!' : ev.type.includes('jump') ? 'SPLAT!' : ev.type.includes('sabotage') ? 'ZAP!' : 'CRASH!'}</span> <span style="font-size:12px">${ev.text}</span></div>`;
      } else if (isPass) {
        html += `<div class="sh-event-good"><span class="sh-action-word" style="font-size:16px;color:var(--comic-green)">${ev.type.includes('meteor') ? 'WHOOSH!' : ev.type.includes('jump') ? 'SOAR!' : ev.type.includes('rescue') ? 'SAVE!' : '✓'}</span> <span style="font-size:12px">${ev.text}</span></div>`;
      } else {
        html += `<div class="sh-event-neutral" style="font-size:12px">${ev.icon} ${ev.text}</div>`;
      }
    }

    // Final time
    const timeColor = res.finalTime <= 35 ? 'var(--comic-green)' : res.finalTime <= 50 ? 'var(--comic-yellow)' : 'var(--comic-red)';
    html += `<div style="text-align:right;margin-top:8px;font-family:'Bangers',cursive;font-size:22px;color:${timeColor}">${res.finalTime}s</div>`;
    html += `</div>`;
    steps.push({ html });
  }

  // Winner
  const winner = oc.winner;
  const winHero = sh.heroes[winner];
  steps.push({ html: `<div class="sh-panel" style="text-align:center;background:var(--comic-yellow);border:4px solid var(--comic-red)">
    <div class="sh-action-word" style="color:var(--comic-red);font-size:36px">IMMUNITY!</div>
    <div style="margin:12px 0">${portrait(winner, 64)}</div>
    <div style="font-family:'Bangers',cursive;font-size:28px;color:${winHero?.color || '#333'}">${winHero?.heroName || winner}</div>
    <div style="font-size:13px;color:rgba(0,0,0,0.5);margin-top:4px">${winner} wins immunity with ${oc.results[winner]?.finalTime}s!</div>
  </div>` });

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="sh-step-obstacle-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="sh-controls-obstacle" class="sh-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="sh-btn-next" onclick="superHeroldRevealNext('sh-obstacle',${totalSteps})">KAPOW!</button>
    <button class="sh-btn-all" onclick="superHeroldRevealAll('sh-obstacle',${totalSteps})">Reveal All</button>
  </div>`;

  // Sidebar — live leaderboard
  const sortedResults = Object.entries(oc.results).sort((a, b) => a[1].finalTime - b[1].finalTime);
  const revealedCount = Math.max(0, Math.min(playerOrder.length, revIdx + 1));
  const revealedPlayers = playerOrder.slice(0, revealedCount);

  let sidebar = `<div class="sh-side-sec">LEADERBOARD</div>`;
  const revealedSorted = revealedPlayers
    .map(n => ({ name: n, time: oc.results[n].finalTime }))
    .sort((a, b) => a.time - b.time);
  for (let i = 0; i < revealedSorted.length; i++) {
    const { name, time } = revealedSorted[i];
    const hero = sh.heroes[name];
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    sidebar += `<div style="display:flex;align-items:center;gap:4px;padding:3px 0;font-size:10px">
      <span style="width:14px">${medal}</span>
      ${portrait(name, 18)}
      <span style="flex:1;color:${hero?.color || '#333'};font-family:'Bangers',cursive;font-size:12px">${hero?.heroName || name}</span>
      <span style="font-family:'Share Tech Mono',monospace;font-weight:700">${time}s</span>
    </div>`;
  }
  if (revealedCount < playerOrder.length) {
    sidebar += `<div style="font-size:9px;color:rgba(0,0,0,0.3);text-align:center;padding:4px 0">${playerOrder.length - revealedCount} more...</div>`;
  }

  return _shShell(`
    <div class="sh-hud">
      <div class="sh-hud-cell"><div class="sh-hud-val">🏃</div><div class="sh-hud-lbl">OBSTACLE</div></div>
      <div class="sh-hud-cell"><div class="sh-hud-val">${Object.keys(oc.results).length}</div><div class="sh-hud-lbl">HEROES</div></div>
      <div class="sh-hud-cell"><div class="sh-hud-val">II</div><div class="sh-hud-lbl">PHASE</div></div>
    </div>
    <div class="sh-layout">
      <div class="sh-feed">${feed}${controls}</div>
      <div class="sh-sidebar" id="sh-sidebar-obstacle">${sidebar}</div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// REVEAL FUNCTIONS
// ══════════════════════════════════════════════════════════════
function _shUpdateSidebar(screenKey, revIdx) {
  // Obstacle sidebar updates live
  if (screenKey !== 'sh-obstacle') return;
  const sideEl = document.getElementById('sh-sidebar-obstacle');
  if (!sideEl) return;
  const latestEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  const sh = latestEp?.superHerold;
  if (!sh) return;
  const oc = sh.obstacleCourse;
  const playerOrder = Object.keys(oc.results);
  const revealedCount = Math.max(0, Math.min(playerOrder.length, revIdx + 2));
  const revealedPlayers = playerOrder.slice(0, revealedCount);
  const revealedSorted = revealedPlayers.map(n => ({ name: n, time: oc.results[n].finalTime })).sort((a, b) => a.time - b.time);

  let sidebar = `<div class="sh-side-sec">LEADERBOARD</div>`;
  for (let i = 0; i < revealedSorted.length; i++) {
    const { name, time } = revealedSorted[i];
    const hero = sh.heroes[name];
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    sidebar += `<div style="display:flex;align-items:center;gap:4px;padding:3px 0;font-size:10px">
      <span style="width:14px">${medal}</span>
      ${portrait(name, 18)}
      <span style="flex:1;color:${hero?.color || '#333'};font-family:'Bangers',cursive;font-size:12px">${hero?.heroName || name}</span>
      <span style="font-family:'Share Tech Mono',monospace;font-weight:700">${time}s</span>
    </div>`;
  }
  if (revealedCount < playerOrder.length) {
    sidebar += `<div style="font-size:9px;color:rgba(0,0,0,0.3);text-align:center;padding:4px 0">${playerOrder.length - revealedCount} more...</div>`;
  }
  sideEl.innerHTML = sidebar;
}

export function superHeroldRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('sh-', '');
  const el = document.getElementById(`sh-step-${suffix}-${state.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`sh-controls-${suffix}`);
    const done = document.getElementById(`sh-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
  _shUpdateSidebar(screenKey, state.idx);
}

export function superHeroldRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('sh-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`sh-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`sh-controls-${suffix}`);
  const done = document.getElementById(`sh-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
  _shUpdateSidebar(screenKey, state.idx);
}

// js/chal/operation-classified.js — Operation: Classified spy challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, addBond } from '../bonds.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function noise(range = 0.3) { return (Math.random() - 0.5) * range; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
const VILLAINS = ['villain', 'schemer', 'mastermind'];
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function canBlackmail(name) {
  const s = pStats(name);
  return VILLAINS.includes(arch(name)) || (s.strategic >= 7 && s.loyalty <= 4);
}
function isShunned(name) {
  const active = gs.activePlayers || [];
  if (active.length <= 1) return false;
  const avgBond = active.filter(p => p !== name).reduce((sum, p) => sum + getBond(name, p), 0) / Math.max(1, active.length - 1);
  return avgBond <= -0.75 || (gs.popularity?.[name] || 0) <= -2;
}
function portrait(name, size = 42) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<span class="oc-port" style="width:${size}px;height:${size}px"><img src="assets/avatars/${slug}.png" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" style="width:100%;height:100%;object-fit:cover"><b style="display:none;color:#fff">${(name||'?')[0]}</b></span>`;
}

// ── RESULT TIERS (rescaled for 0.02-0.04 coefficients) ──
function scanResult(score) {
  if (score > 0.10) return 'clear';
  if (score > 0.00) return 'watched';
  return 'flagged';
}
function laserResult(score) {
  if (score > 0.38) return 'ghost';
  if (score > 0.25) return 'clean';
  if (score > 0.15) return 'alarm';
  return 'hit';
}
function defusalResult(score) {
  if (score > 0.36) return 'perfect';
  if (score > 0.18) return 'defused';
  if (score > 0.08) return 'messy';
  return 'blast';
}

// ── TEXT POOLS ──
const SCAN_TEXT = {
  clear: [
    (p, pr) => `${p}'s face scan clears instantly. Authorized agent. ${pr.Sub} walk${pr.sub === 'they' ? '' : 's'} in like ${pr.sub} own${pr.sub === 'they' ? '' : 's'} the place.`,
    (p, pr) => `The scanner flashes green for ${p}. No hesitation. Smooth entry.`,
    (p, pr) => `${p} stares into the camera with perfect composure. CLEARANCE GRANTED.`,
  ],
  watched: [
    (p, pr) => `${p}'s scan hangs for three seconds. The system lets ${pr.obj} through but keeps a camera locked on ${pr.obj}.`,
    (p, pr) => `The scanner pauses on ${p}. Yellow light. "Proceed with caution." Not ideal.`,
    (p, pr) => `${p} gets through, but the system flags ${pr.obj} for monitoring. Every move tracked.`,
  ],
  flagged: [
    (p, pr) => `${p} touches the handle and the whole set screams. INTRUDER FLAGGED. ${pr.Sub} start${pr.sub === 'they' ? '' : 's'} the mission already compromised.`,
    (p, pr) => `ALERT! ${p}'s face doesn't match any authorized agent. Alarms blare. Bad start.`,
    (p, pr) => `The scanner goes red. ${p} gets hit with a spotlight. "INTRUDER DETECTED." Everyone turns.`,
  ],
};
const LASER_TEXT = {
  ghost: [
    (p, pr) => `${p} reads the laser rhythm, drops under a beam, rolls through a blind spot. The room was built for ${pr.obj}.`,
    (p, pr) => `${p} moves through the lasers like smoke. Not a single beam touched. Ghost protocol.`,
    (p, pr) => `${p} contorts between the beams with impossible precision. The security feed shows nothing.`,
  ],
  clean: [
    (p, pr) => `${p} takes the slow route. One step, one breath, one clean crossing. Not flashy, but alive.`,
    (p, pr) => `${p} inches through the grid carefully. A few close calls but no contact. Clean.`,
    (p, pr) => `${p} crawls under the lowest beams. Takes forever but gets through untouched.`,
  ],
  alarm: [
    (p, pr) => `${p} clips a beam with ${pr.posAdj} shoulder. The siren kicks on. Every camera swings toward ${pr.obj}.`,
    (p, pr) => `${p}'s elbow catches a laser. ALARM! Red lights flood the vault.`,
    (p, pr) => `Almost through — then ${p} trips the last beam. The alarm is deafening.`,
  ],
  hit: [
    (p, pr) => `${p} freezes, guesses wrong, and walks straight into a wall of red light. COMPROMISED.`,
    (p, pr) => `${p} panics and runs. Through three beams. The console marks ${pr.obj} a total security breach.`,
    (p, pr) => `${p} doesn't even make it past the first row. Hit. Hit. Hit. ${host()} winces.`,
  ],
};
const DEFUSAL_TEXT = {
  perfect: [
    (p, pr, wire) => `${p} studies the panel, trusts the pattern, and cuts ${wire}. Timer dies at 00:01. Perfect.`,
    (p, pr, wire) => `${p} doesn't hesitate. ${wire} wire. Snip. Silence. The bomb is dead. Textbook defusal.`,
    (p, pr, wire) => `${p} traces the circuit with ${pr.posAdj} finger, finds the ${wire} wire, and cuts. 00:00. Flawless.`,
  ],
  defused: [
    (p, pr, wire) => `${p} picks ${wire}, winces, and cuts. The bomb sputters out. Not elegant, but alive.`,
    (p, pr, wire) => `${p} goes with ${pr.posAdj} gut: ${wire}. The timer stops. ${pr.Sub} exhale${pr.sub === 'they' ? '' : 's'} for the first time in a minute.`,
    (p, pr, wire) => `"${wire.toUpperCase()}. Definitely ${wire}." ${p} cuts. The beeping stops. Lucky guess? Maybe. But it worked.`,
  ],
  messy: [
    (p, pr, wire) => `${p} cuts ${wire}. Timer stops... starts again... dies. Warning foam sprays everywhere.`,
    (p, pr, wire) => `${p} snips ${wire}. The bomb doesn't explode but sprays tomato-red foam all over ${pr.obj}.`,
    (p, pr, wire) => `Wrong wire. Then the RIGHT wire. ${p} is covered in chemical foam but technically alive.`,
  ],
  blast: [
    (p, pr, wire) => `${p} panics and cuts ${wire}. Wrong wire. The blast doors slam. FAILED.`,
    (p, pr, wire) => `${p}'s hands shake too much. Cuts ${wire} by accident. BOOM. Stink bomb detonates.`,
    (p, pr, wire) => `${p} freezes at the panel. Timer hits zero. The explosion covers ${pr.obj} in the worst smell known to humanity.`,
  ],
};
const WIRETAP_TEXT = {
  intel: [
    (p, pr) => `${p} watches the monitor wall instead of the lasers. A glance, a whisper, a reflection. ${pr.Sub} leave${pr.sub === 'they' ? '' : 's'} with useful intel.`,
    (p, pr) => `${p} intercepts a feed and memorizes the camera rotation patterns. Knowledge is power.`,
    (p, pr) => `${p} finds a blind spot in the surveillance. Files it away. That'll come in handy.`,
  ],
  allianceAccepted: [
    (pitcher, targets) => `WIRETAP: ${pitcher} uses the camera blackout to approach ${targets.join(' and ')}. "Can I count on you two?" Quiet nods. A bond forms in the dark.`,
    (pitcher, targets) => `${pitcher} corners ${targets.join(' and ')} during the static. "I need people I can trust." They shake on it. Not an alliance — but a promise.`,
    (pitcher, targets) => `${pitcher} has been on the outs. But ${targets.join(' and ')} listen this time. "We've got your back." Something shifted.`,
  ],
  allianceFailed: [
    (pitcher, targets) => `WIRETAP: ${pitcher} tries to turn being shunned into leverage. ${targets.join(' and ')} listen but walk away. No deal.`,
    (pitcher, targets) => `${pitcher}'s pitch falls flat. ${targets[0]} looks at ${targets[1] || 'the floor'}. "We'll think about it." Translation: no.`,
    (pitcher, targets) => `"I know nobody trusts me, but—" ${pitcher} didn't finish. ${targets.join(' and ')} were already gone.`,
  ],
  blackmailFoiled: [
    (bm, target, exposer) => `BLACKMAIL FOILED: ${bm} corners ${target} with dirt from the mission feed. ${exposer} catches the recording and flips it back. The leverage burns in public.`,
    (bm, target, exposer) => `${exposer} intercepts ${bm}'s play against ${target}. "Nice try." The wiretap catches everything. ${bm} is exposed.`,
  ],
  blackmailSuccess: [
    (bm, target) => `BLACKMAIL: ${bm} gets ${target} alone and weaponizes what the cameras caught. Ugly, quiet, and effective.`,
    (bm, target) => `${bm} slides up to ${target}. "I know what you did in the laser vault." ${target}'s face goes white. Leverage acquired.`,
  ],
};
const DRAMA_EVENTS = [
  {
    id: 'panicHug',
    check(all) { return all.length >= 2; },
    apply(all, ep) {
      const pair = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      addBond(pair[0], pair[1], 0.4);
      const texts = [
        `The countdown starts. ${pair[0]} and ${pair[1]} grab each other. "IS THIS REAL?!" It's not. ${host()} laughs.`,
        `${pair[0]} hugs ${pair[1]} during the false alarm. "For the record, that was a PITY hug." Sure it was.`,
        `The explosion scare sends ${pair[0]} into ${pair[1]}'s arms. They stay there longer than necessary.`,
      ];
      return { text: pick(texts), players: [pair[0], pair[1]], badgeText: 'PANIC HUG', badgeClass: 'green' };
    },
  },
  {
    id: 'suspicion',
    check(all) { return all.length >= 2; },
    apply(all, ep) {
      const suspicious = all.filter(n => pStats(n).strategic >= 6);
      if (!suspicious.length) return null;
      const a = pick(suspicious);
      const b = pick(all.filter(n => n !== a));
      addBond(a, b, -0.3);
      const texts = [
        `${a} noticed ${b} lingering near the control panel. "What were you looking at?" ${b}: "Nothing." Suspicious.`,
        `${a} doesn't trust ${b} after the wiretap phase. "You were feeding info to someone." The paranoia is setting in.`,
      ];
      return { text: pick(texts), players: [a, b], badgeText: 'SUSPICION', badgeClass: 'red' };
    },
  },
  {
    id: 'gadgetBond',
    check(all) { return all.length >= 2; },
    apply(all, ep) {
      const pair = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      addBond(pair[0], pair[1], 0.3);
      const texts = [
        `${pair[0]} and ${pair[1]} geek out over the spy gadgets between phases. "Check out this grappling hook!" Nerd bonding.`,
        `${pair[0]} shows ${pair[1]} how to read the laser pattern. "See? Every 4 seconds." Respect earned.`,
      ];
      return { text: pick(texts), players: [pair[0], pair[1]], badgeText: 'SPY BONDING', badgeClass: 'green' };
    },
  },
  {
    id: 'hostTaunt',
    check(all) { return true; },
    apply(all, ep) {
      const target = pick(all);
      popDelta(target, -1);
      const h = host();
      const texts = [
        `${h} appeared on the hologram. "Fun fact: ${target}'s scan was the WORST I've ever seen. And I've scanned monkeys."`,
        `"${target}, your spy skills are an international incident." ${h} sipped coffee on the monitor.`,
      ];
      return { text: pick(texts), players: [target], badgeText: 'HOST TAUNT', badgeClass: 'amber' };
    },
  },
  {
    id: 'falseAlarm',
    check(all) { return all.length >= 2; },
    apply(all, ep) {
      const pair = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      const texts = [
        `${host()} starts a 10-second countdown. Everyone panics. ${pair[0]} and ${pair[1]} brace for impact. ...Nothing. ${host()} cackles.`,
        `BOOM! ...Just a sound effect. ${host()}: "Your faces! PRICELESS!" ${pair[0]} nearly fainted. ${pair[1]} threw a shoe at the speaker.`,
      ];
      return { text: pick(texts), players: [pair[0], pair[1]], badgeText: 'FALSE ALARM', badgeClass: 'amber' };
    },
  },
  {
    id: 'confessional',
    check(all) { return all.length >= 1; },
    apply(all, ep) {
      const p = pick(all);
      const pr = pronouns(p);
      const texts = [
        `${p}: "I'm not a spy. I can barely unlock my own phone."`,
        `${p}: "If I survive this, I'm adding 'secret agent' to my resume."`,
        `${p}: "The lasers are one thing. But ${host()} in a turtleneck? THAT'S the real horror."`,
        `${p}: "I'm trusting my gut from here. My brain gave up three phases ago."`,
      ];
      return { text: pick(texts), players: [p], badgeText: 'CONFESSIONAL', badgeClass: 'amber' };
    },
  },
  {
    id: 'blameGame',
    check(all) { return all.length >= 2; },
    apply(all, ep) {
      const blamer = pick(all);
      const blamed = pick(all.filter(n => n !== blamer));
      addBond(blamer, blamed, -0.4);
      const texts = [
        `"You tripped the alarm back there." ${blamer} jabbed a finger at ${blamed}. "That's on YOU."`,
        `${blamer} was furious. "${blamed} almost got us ALL caught. I'm not going down because of someone else's mistake."`,
        `"If we lose this, I know who to blame." ${blamer} glared at ${blamed}. The tension was suffocating.`,
      ];
      return { text: pick(texts), players: [blamer, blamed], badgeText: 'BLAME GAME', badgeClass: 'red' };
    },
  },
  {
    id: 'sabotageAccuse',
    check(all) { return all.some(n => VILLAINS.includes(arch(n))); },
    apply(all, ep) {
      const accuser = pick(all.filter(n => pStats(n).intuition >= 5));
      if (!accuser) return null;
      const suspect = pick(all.filter(n => n !== accuser && VILLAINS.includes(arch(n))));
      if (!suspect) return null;
      addBond(accuser, suspect, -0.3);
      addBond(suspect, accuser, -0.3);
      const texts = [
        `${accuser} pulled ${suspect} aside. "I saw you near that control panel. You're sabotaging us." ${suspect}: "Prove it."`,
        `"Something's off about ${suspect}." ${accuser} said it loud enough for everyone to hear. The paranoia spread.`,
      ];
      return { text: pick(texts), players: [accuser, suspect], badgeText: 'ACCUSATION', badgeClass: 'red' };
    },
  },
  {
    id: 'betrayalWhisper',
    check(all) { return all.length >= 3; },
    apply(all, ep) {
      const plotter = pick(all.filter(n => pStats(n).strategic >= 5));
      if (!plotter) return null;
      const target = pick(all.filter(n => n !== plotter && getBond(plotter, n) < 0));
      if (!target) return null;
      const recruit = pick(all.filter(n => n !== plotter && n !== target));
      if (!recruit) return null;
      addBond(plotter, recruit, 0.2);
      addBond(target, plotter, -0.2);
      const texts = [
        `${plotter} whispered to ${recruit}: "After this, we vote ${target}. You in?" A glance. A nod. Done.`,
        `${plotter} leaned into ${recruit} during the break. "If we survive this, ${target} goes home." Seeds planted.`,
      ];
      return { text: pick(texts), players: [plotter, recruit, target], badgeText: 'PLOTTING', badgeClass: 'red' };
    },
  },
  {
    id: 'panicMeltdown',
    check(all) { return all.some(n => pStats(n).temperament <= 3); },
    apply(all, ep) {
      const panicker = pick(all.filter(n => pStats(n).temperament <= 3));
      if (!panicker) return null;
      popDelta(panicker, -1);
      const pr = pronouns(panicker);
      const texts = [
        `${panicker} completely lost it. "I CAN'T DO THIS ANYMORE!" ${pr.Sub} kicked the wall. Then immediately apologized to the wall.`,
        `${panicker} was hyperventilating between phases. "Lasers? Bombs? What's NEXT?!" ${host()} smiled. That wasn't reassuring.`,
      ];
      return { text: pick(texts), players: [panicker], badgeText: 'MELTDOWN', badgeClass: 'red' };
    },
  },
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
const INLINE_REACTIONS = {
  scanFlaggedHost: [
    (h, p) => `${h} appeared on the hologram. "Fun fact: ${p}'s scan was the WORST I've ever seen. And I've scanned monkeys."`,
    (h, p) => `${h}: "${p}, even the DOOR doesn't want you here." The others tried not to laugh.`,
    (h, p) => `"${p}... your face literally broke the scanner." ${h} was delighted.`,
  ],
  scanFlaggedReact: [
    (reactor, p) => `${reactor} watched ${p} get flagged. "Yikes. Glad that wasn't me."`,
    (reactor, p) => `${reactor} winced as ${p}'s alarm blared. "That's... not great for us."`,
  ],
  scanClearReact: [
    (reactor, p) => `${reactor} nodded at ${p}'s clean scan. "Smooth. Very smooth."`,
    (reactor, p) => `"Show-off," ${reactor} muttered as ${p} breezed through. Half-jealous.`,
  ],
  laserGhostReact: [
    (reactor, p) => `${reactor} watched ${p} glide through the lasers. "...How?!" Pure disbelief.`,
    (reactor, p) => `"OK, ${p} has done this before. Nobody moves like that on a first try." ${reactor} was shook.`,
  ],
  laserHitReact: [
    (reactor, p) => `${reactor} covered ${reactor === p ? '' : 'their '}eyes as ${p} hit the beam. "That had to hurt."`,
    (h, p) => `${h}: "And THAT, kids, is why you don't run through a laser grid." ${p} was not amused.`,
  ],
  defusalPerfectReact: [
    (reactor, p) => `${reactor}'s jaw dropped. "${p} cut that wire like it was NOTHING." Respect.`,
    (h, p) => `${h} slow-clapped. "00:01 on the clock. ${p}, you absolute psychopath. Beautiful."`,
  ],
  defusalBlastReact: [
    (reactor, p) => `${reactor} backed away from ${p}'s exploding bomb. "I am NOT standing near you for the next one."`,
    (h, p) => `${h} pinched his nose. "${p}'s bomb went off and now the whole SET smells. Thanks, ${p}."`,
  ],
  suspicion: [
    (a, b) => `${a} noticed ${b} lingering near the control panel. "What were you looking at?" ${b}: "Nothing." Suspicious.`,
    (a, b) => `${a} caught ${b} whispering to someone during the scan phase. "Who were you talking to?" Eyes narrowing.`,
  ],
  confessional: [
    (p) => `${p}: "I'm not a spy. I can barely unlock my own phone. But here we are."`,
    (p) => `${p}: "${host()} in a turtleneck? THAT'S the real horror of this challenge."`,
    (p) => `${p}: "If I survive this, I'm adding 'secret agent' to my resume."`,
    (p) => `${p}: "I trusted my gut. My gut was wrong. My gut is fired."`,
  ],
};

function _simulateScan(active, state, timeline) {
  for (const name of active) {
    const s = pStats(name);
    const pr = pronouns(name);
    const score = s.temperament * 0.02 + s.boldness * 0.01 + noise(0.4);
    const result = scanResult(score);
    const delta = result === 'clear' ? 1 : result === 'watched' ? 0 : -1;
    state.players[name].scan = { score, result };
    state.players[name].total += delta;
    if (result === 'flagged') state.alarm += 8;
    timeline.scan.push({
      type: result, player: name, score,
      text: pick(SCAN_TEXT[result])(name, pr),
    });

    // Inline reactions after notable results
    if (result === 'flagged') {
      // Host roasts the flagged player
      timeline.scan.push({ type: 'reaction', player: name,
        text: pick(INLINE_REACTIONS.scanFlaggedHost)(host(), name) });
      popDelta(name, -1);
      // Another castmate reacts
      const reactor = pick(active.filter(n => n !== name));
      if (reactor) {
        timeline.scan.push({ type: 'reaction', players: [reactor, name],
          text: pick(INLINE_REACTIONS.scanFlaggedReact)(reactor, name) });
      }
    } else if (result === 'clear' && Math.random() < 0.3) {
      const reactor = pick(active.filter(n => n !== name));
      if (reactor) {
        timeline.scan.push({ type: 'reaction', players: [reactor, name],
          text: pick(INLINE_REACTIONS.scanClearReact)(reactor, name) });
      }
    }
  }

  // Suspicion event between two players (~35%)
  if (active.length >= 2 && Math.random() < 0.35) {
    const a = pick(active.filter(n => pStats(n).strategic >= 5));
    if (a) {
      const b = pick(active.filter(n => n !== a));
      if (b) {
        addBond(a, b, -0.2);
        timeline.scan.push({ type: 'reaction', players: [a, b],
          text: pick(INLINE_REACTIONS.suspicion)(a, b) });
      }
    }
  }

  // Confessional from a random player (~40%)
  if (Math.random() < 0.4) {
    const conf = pick(active);
    timeline.scan.push({ type: 'reaction', player: conf,
      text: pick(INLINE_REACTIONS.confessional)(conf) });
  }
}

const LASER_MID_EVENTS = {
  stuck: [
    (a, b) => `${a} and ${b} got tangled between the same two beams. "STOP MOVING!" "YOU stop moving!"`,
    (a, b) => `${a} froze and ${b} nearly walked into ${a}. "GO! MOVE!" They were gridlocked between lasers.`,
  ],
  showmanceMoment: [
    (a, b) => `${a} slid under a laser with impressive flexibility. ${b} stared. "${b}... focus." ${b} couldn't.`,
    (a, b) => `${a} grabbed ${b}'s hand to pull ${b} under a beam. They held on a second too long.`,
  ],
  panicFreeze: [
    (p, pr) => `${p} looked up and saw the web of lasers ahead. ${pr.Sub} froze. Completely locked up.`,
    (p, pr) => `${p}'s legs wouldn't move. The red beams were everywhere. "I can't do this."`,
  ],
  helpOther: [
    (a, b) => `${a} guided ${b} through a tight gap. "Duck... lower... NOW!" Teamwork in the vault.`,
    (a, b) => `"Follow exactly where I step," ${a} told ${b}. ${b} did. They both made it through.`,
  ],
  bagGrab: [
    (p, pr) => `${p} reached the center, smashed the glass case, and grabbed the bag! Wire cutters and a grappling hook inside.`,
    (p, pr) => `${p} dove for the bag in the glass case. Got it! ${pr.Sub} pulled out wire cutters. "These will be useful..."`,
  ],
  countdownPrank: [
    (h) => `${h} started a 10-second countdown. Everyone panicked. Hugging, screaming, fetal positions. ...Nothing happened. ${h} laughed hysterically. "Your FACES!"`,
    (h) => `"SELF-DESTRUCT IN 10... 9... 8..." Everyone grabbed whoever was closest. At zero: silence. ${h}: "Just kidding! ...OR AM I?" Then he laughed.`,
  ],
  countdownReal: [
    (h) => `Then ${h} started ANOTHER countdown. "This one's real. Probably." Nobody was laughing this time.`,
  ],
};

const LASER_STEPS = 5;
const LASER_STEP_NAMES = ['ENTRY CORRIDOR', 'OUTER GRID', 'INNER GRID', 'VAULT CORE', 'THE BAG'];

const LASER_ADVANCE = [
  (p, pr, step) => `${p} reads the beam pattern and slips through to ${LASER_STEP_NAMES[step]}. Clean.`,
  (p, pr, step) => `${p} ducks under a sweeping beam and advances. Step ${step + 1} of ${LASER_STEPS}.`,
  (p, pr, step) => `${p} times it perfectly — through the gap, into ${LASER_STEP_NAMES[step]}.`,
  (p, pr, step) => `${p} contorts between two crossing beams. Made it to step ${step + 1}.`,
  (p, pr, step) => `${p} rolls under the lowest beam and pops up on the other side. ${LASER_STEP_NAMES[step]}.`,
];
const LASER_RESET = [
  (p, pr) => `${p} clips a beam — RED ALARM! Back to the start. Everything resets.`,
  (p, pr) => `BZZZZT! ${p} touches a laser. Sirens blare. ${pr.Sub} ha${pr.sub === 'they' ? 've' : 's'} to go ALL the way back.`,
  (p, pr) => `${p}'s shoulder grazes a beam. The alarm screams. "BACK TO START!" ${host()} shouts.`,
  (p, pr) => `${p} trips into a laser wall. Multiple beams hit. Total reset. ${pr.Sub} look${pr.sub === 'they' ? '' : 's'} devastated.`,
];

function _simulateLaser(active, state, timeline, ep) {
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

  // Track position per player
  const positions = {};
  const maxReached = {};
  active.forEach(n => { positions[n] = 0; maxReached[n] = 0; });
  let bagWinner = null;
  const laserRounds = [];

  // Race — max 8 turns (to prevent infinite loops)
  for (let turn = 1; turn <= 8; turn++) {
    if (bagWinner) break;
    const turnEvents = [];
    turnEvents.push({ type: 'turn-label', text: `— TURN ${turn} —` });

    // Shuffle order each turn
    const turnOrder = [...active].sort(() => Math.random() - 0.5);
    for (const name of turnOrder) {
      if (positions[name] >= LASER_STEPS) continue; // already at bag
      const s = pStats(name);
      const pr = pronouns(name);
      const scanMod = state.players[name].scan?.result === 'flagged' ? -0.05 : state.players[name].scan?.result === 'clear' ? 0.03 : 0;
      const stepDifficulty = positions[name] * 0.05;
      const check = s.physical * 0.03 + s.intuition * 0.02 + s.mental * 0.02 + scanMod - stepDifficulty + noise(0.35);
      const passed = check > 0.34;

      if (passed) {
        positions[name]++;
        if (positions[name] > maxReached[name]) maxReached[name] = positions[name];
        if (positions[name] >= LASER_STEPS && !bagWinner) {
          // First to reach the bag!
          bagWinner = name;
          turnEvents.push({ type: 'bag', player: name,
            text: pick(LASER_MID_EVENTS.bagGrab)(name, pr) });
          state.players[name].total += 3;
        } else {
          turnEvents.push({ type: 'advance', player: name, step: positions[name],
            text: pick(LASER_ADVANCE)(name, pr, positions[name] - 1) });
        }
      } else {
        // Hit a beam — reset to 0
        const wasAt = positions[name];
        positions[name] = 0;
        state.alarm += wasAt > 2 ? 12 : 6;
        turnEvents.push({ type: 'reset', player: name, wasAt,
          text: pick(LASER_RESET)(name, pr) });

        // Inline reaction (~40%)
        if (Math.random() < 0.4) {
          const reactor = Math.random() < 0.4 ? host() : pick(active.filter(n => n !== name));
          if (reactor) {
            turnEvents.push({ type: 'reaction', player: name,
              text: pick(INLINE_REACTIONS.laserHitReact)(reactor, name) });
          }
        }
      }
    }

    // Mid-turn events (~30% per turn)
    if (Math.random() < 0.3 && active.length >= 2) {
      // Stuck together, showmance, help, etc.
      const eventPool = [];
      // Stuck
      const pair = active.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      if (Math.abs(positions[pair[0]] - positions[pair[1]]) <= 1) {
        eventPool.push({ type: 'stuck', players: pair, text: pick(LASER_MID_EVENTS.stuck)(pair[0], pair[1]) });
      }
      // Help
      const helper = active.find(n => positions[n] > 0 && (pStats(n).loyalty >= 6 || ['hero', 'loyal-soldier'].includes(arch(n))));
      if (helper) {
        const behind = active.filter(n => n !== helper && positions[n] < positions[helper]);
        if (behind.length) {
          const helped = pick(behind);
          eventPool.push({ type: 'help', players: [helper, helped], text: pick(LASER_MID_EVENTS.helpOther)(helper, helped), helper, helped });
        }
      }
      // Showmance
      const sm = gs.showmances?.find(s => active.includes(s.a) && active.includes(s.b));
      if (sm) {
        eventPool.push({ type: 'showmance', players: [sm.a, sm.b], text: pick(LASER_MID_EVENTS.showmanceMoment)(sm.a, sm.b) });
      }

      if (eventPool.length) {
        const chosen = pick(eventPool);
        turnEvents.push(chosen);
        if (chosen.type === 'stuck') addBond(chosen.players[0], chosen.players[1], -0.2);
        if (chosen.type === 'help') { addBond(chosen.helper, chosen.helped, 0.4); positions[chosen.helped] = Math.min(LASER_STEPS - 1, positions[chosen.helped] + 1); }
        if (chosen.type === 'showmance') addBond(chosen.players[0], chosen.players[1], 0.3);
      }
    }

    // Position snapshot for sidebar
    const snapshot = {};
    active.forEach(n => { snapshot[n] = positions[n]; });
    laserRounds.push({ turn, events: turnEvents, positions: { ...snapshot } });

    // Push all turn events to timeline
    for (const ev of turnEvents) timeline.laser.push(ev);
  }

  // If nobody reached the bag in 8 turns, closest player gets it
  if (!bagWinner) {
    const closest = [...active].sort((a, b) => positions[b] - positions[a])[0];
    bagWinner = closest;
    const pr = pronouns(closest);
    timeline.laser.push({ type: 'bag', player: closest,
      text: `Time runs out! ${closest} was closest to the bag at step ${positions[closest]} and grabs it in the chaos.` });
    state.players[closest].total += 2;
  }

  state.laserBagWinner = bagWinner;
  state.laserRounds = laserRounds;
  state.laserPositions = positions;
  state.laserMaxReached = maxReached;

  // Individual points based on max step reached
  active.forEach(n => {
    state.players[n].total += maxReached[n];
    state.players[n].laser = { maxStep: maxReached[n], finalPos: positions[n] };
    if (!ep.chalMemberScores) ep.chalMemberScores = {};
    ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) + maxReached[n];
  });

  // ── COUNTDOWN SEQUENCE ──

  // 1. First countdown — fake, everyone panics
  timeline.laser.push({ type: 'countdown-fake',
    text: pick(LASER_MID_EVENTS.countdownPrank)(host()) });

  // Panic hug bonds
  if (active.length >= 2) {
    const hugPair = active.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    addBond(hugPair[0], hugPair[1], 0.3);
    timeline.laser.push({ type: 'reaction', players: [hugPair[0], hugPair[1]],
      text: `${hugPair[0]} and ${hugPair[1]} grabbed each other in pure panic. They held on way too long after the fake-out.` });
  }

  // 2. Second countdown — "this one's real"
  timeline.laser.push({ type: 'countdown-real',
    text: pick(LASER_MID_EVENTS.countdownReal)(host()) });

  // 3. Bag winner faces THE CHOICE
  const bw = bagWinner;
  const bwS = pStats(bw);
  const bwPr2 = pronouns(bw);
  const others = active.filter(n => n !== bw);

  // Decision logic: selfish vs selfless
  // Selfish factors: high strategic, low loyalty, villain archetype, high heat, low avg bond
  // Selfless factors: high loyalty, hero/loyal-soldier, high avg bond, nice archetype
  const avgBond = others.length ? others.reduce((s, n) => s + getBond(bw, n), 0) / others.length : 0;
  const hasHeat = (gs.popularity?.[bw] || 0) <= -2 || others.some(n => getBond(bw, n) < -3);
  const isVillainType = VILLAINS.includes(arch(bw));
  const isNiceType = ['hero', 'loyal-soldier', 'social-butterfly', 'underdog'].includes(arch(bw));

  const selfishScore = bwS.strategic * 0.3 + (10 - bwS.loyalty) * 0.3 + (isVillainType ? 2 : 0) + (hasHeat ? 1.5 : 0) + (avgBond < 0 ? 1 : 0) + noise(3);
  const selflessScore = bwS.loyalty * 0.3 + bwS.social * 0.2 + (isNiceType ? 2 : 0) + (avgBond > 2 ? 1.5 : 0) + noise(3);

  const choseSelfish = selfishScore > selflessScore;
  state.laserChoice = { player: bw, choseSelfish };

  if (choseSelfish) {
    // Keep wire cutters — defusal advantage, everyone resents them
    const choiceTexts = [
      `${bw} looked at the grappling hook, then at the wire cutters. ${bwPr2.Sub} pocketed the cutters. "Every agent for themselves." The others stared in disbelief.`,
      `"Sorry, but I need these." ${bw} clutched the wire cutters while the countdown ticked. ${bwPr2.Sub} wasn't sharing.`,
      `${bw} made ${bwPr2.posAdj} choice in a heartbeat. Wire cutters in pocket, grappling hook on the floor. "I'm winning immunity. Deal with it."`,
    ];
    timeline.laser.push({ type: 'choice-selfish', player: bw,
      text: pick(choiceTexts) });

    // Everyone resents the bag winner
    for (const other of others) {
      addBond(other, bw, -0.4);
    }
    popDelta(bw, -2);
    state.players[bw].total += 2; // keeps the defusal bonus

    // Chris reveals it was fake AGAIN — the selfish choice was for nothing socially
    const revealTexts = [
      `${host()} burst out laughing. "FAKE AGAIN! There's no budget for explosions!" ${bw} kept the cutters anyway. The damage was done.`,
      `"You really thought I'd blow up my own set?" ${host()} wiped tears of laughter. ${bw} had the wire cutters... and zero friends.`,
    ];
    timeline.laser.push({ type: 'countdown-reveal', player: bw,
      text: pick(revealTexts) });

    // Others react
    const angryReactor = pick(others);
    if (angryReactor) {
      const rTexts = [
        `${angryReactor} stared at ${bw}. "You chose WIRE CUTTERS over saving us. I won't forget that."`,
        `"Real nice, ${bw}." ${angryReactor}'s voice was ice. The group remembered.`,
      ];
      timeline.laser.push({ type: 'reaction', players: [angryReactor, bw],
        text: pick(rTexts) });
    }

    ep.campEvents[campKey].post.push({
      text: `${bw} chose wire cutters over saving the group during the countdown. Trust shattered.`,
      players: [bw], badgeText: 'SELFISH CHOICE', badgeClass: 'red', tag: 'drama'
    });
  } else {
    // Use grappling hook — save everyone, bonds + respect
    const choiceTexts = [
      `${bw} grabbed the grappling hook without hesitation. "EVERYBODY HOLD ON!" ${bwPr2.Sub} fired it at the ceiling and pulled the group to safety.`,
      `"We're getting out of here. ALL of us." ${bw} used the grappling hook to create an escape route. One by one, they climbed out.`,
      `${bw} didn't even think about it. Grappling hook deployed. "GRAB THE LINE!" The group made it out together.`,
    ];
    timeline.laser.push({ type: 'choice-selfless', player: bw,
      text: pick(choiceTexts) });

    // Bond boost with everyone
    for (const other of others) {
      addBond(other, bw, 0.4);
    }
    popDelta(bw, 3);
    // No defusal bonus — they gave up the wire cutters
    state.players[bw].total += 1;

    // Chris reveals it was fake
    const revealTexts = [
      `${host()} appeared on the monitor, clapping slowly. "Beautiful. Heroic. Also... totally unnecessary. It was fake." ${bw} didn't regret it.`,
      `"The countdown was fake, obviously." ${host()} shrugged. "But that rescue? GREAT television." ${bw} earned real respect.`,
    ];
    timeline.laser.push({ type: 'countdown-reveal', player: bw,
      text: pick(revealTexts) });

    // Others react positively
    const gratefulReactor = pick(others);
    if (gratefulReactor) {
      const rTexts = [
        `${gratefulReactor} grabbed ${bw}'s arm. "You saved us. I owe you one." Genuine gratitude.`,
        `"You're alright, ${bw}." ${gratefulReactor} nodded with respect. That choice meant something.`,
      ];
      timeline.laser.push({ type: 'reaction', players: [gratefulReactor, bw],
        text: pick(rTexts) });
    }

    ep.campEvents[campKey].post.push({
      text: `${bw} used the grappling hook to save the group during the countdown. Respect earned.`,
      players: [bw], badgeText: 'HEROIC SAVE', badgeClass: 'green', tag: 'drama'
    });
  }
}

// Wiretap 1: intel gathering + alliance pitch + drama (before laser vault)
function _simulateWiretap1(active, state, timeline, ep) {
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

  // Intel gathering
  const intelScores = active.map(name => {
    const s = pStats(name);
    const score = s.strategic * 0.04 + s.intuition * 0.03 + s.social * 0.02 + noise(0.3);
    state.players[name].intel = { score };
    state.players[name].total += score > 0.28 ? 2 : 0;
    return { name, score };
  }).sort((a, b) => b.score - a.score);
  state.intelScores = intelScores;

  // Top 2 get intel event
  intelScores.slice(0, 2).forEach(({ name }) => {
    const pr = pronouns(name);
    timeline.wiretap1.push({
      type: 'intel', player: name, score: intelScores.find(i => i.name === name).score,
      text: pick(WIRETAP_TEXT.intel)(name, pr),
    });
  });

  // Alliance pitch from shunned player
  const pitcher = active.filter(isShunned).sort((a, b) => pStats(b).strategic + pStats(b).social - pStats(a).strategic - pStats(a).social)[0];
  if (pitcher) {
    const pool = active.filter(p => p !== pitcher)
      .map(p => ({ name: p, weight: pStats(p).strategic * 0.03 + pStats(p).social * 0.02 + getBond(pitcher, p) * 0.01 + noise(0.2) }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2).map(x => x.name);
    const accepted = pool.length >= 2 && (pStats(pitcher).social * 0.04 + pStats(pitcher).strategic * 0.03 + noise(0.3)) > 0.28;
    state.alliancePitch = { pitcher, targets: pool, accepted };
    if (accepted) {
      pool.forEach(p => addBond(pitcher, p, 0.5));
      state.players[pitcher].total += 2;
      popDelta(pitcher, 1);
      ep.campEvents[campKey].post.push({ text: pick(WIRETAP_TEXT.allianceAccepted)(pitcher, pool), players: [pitcher, ...pool], badgeText: 'TRUST EARNED', badgeClass: 'green', tag: 'drama' });
    } else {
      pool.forEach(p => addBond(pitcher, p, -0.2));
      ep.campEvents[campKey].post.push({ text: pick(WIRETAP_TEXT.allianceFailed)(pitcher, pool), players: [pitcher, ...pool], badgeText: 'FAILED PITCH', badgeClass: 'red', tag: 'drama' });
    }
    timeline.wiretap1.push({
      type: accepted ? 'alliance' : 'alliance-fail', player: pitcher, players: [pitcher, ...pool],
      text: accepted ? pick(WIRETAP_TEXT.allianceAccepted)(pitcher, pool) : pick(WIRETAP_TEXT.allianceFailed)(pitcher, pool),
    });
  }

  // Drama events mixed in (2-3)
  _addDramaToTimeline(active, timeline.wiretap1, ep, 2 + Math.floor(Math.random() * 2));
}

// Wiretap 2: blackmail + drama (before bomb defusal)
function _simulateWiretap2(active, state, timeline, ep) {
  const campKey = gs.mergeName || 'merge';
  const intelScores = state.intelScores || [];

  // Blackmail attempt
  const blackmailer = active.filter(canBlackmail).sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  if (blackmailer) {
    const target = active.filter(p => p !== blackmailer).sort((a, b) => getBond(blackmailer, a) - getBond(blackmailer, b))[0];
    const exposer = intelScores.find(x => x.name !== blackmailer && x.name !== target)?.name;
    const bmCheck = pStats(blackmailer).strategic * 0.04 + (10 - pStats(blackmailer).loyalty) * 0.02 + noise(0.3);
    const expCheck = exposer ? pStats(exposer).intuition * 0.04 + pStats(exposer).strategic * 0.03 + noise(0.3) : 0;
    const foiled = exposer && expCheck >= bmCheck - 0.03;
    state.blackmail = { blackmailer, target, exposer, foiled };
    if (foiled) {
      addBond(target, blackmailer, -0.5);
      addBond(exposer, target, 0.4);
      state.players[blackmailer].total -= 3;
      state.players[exposer].total += 2;
      state.alarm += 14;
      popDelta(blackmailer, -2);
      ep.campEvents[campKey].post.push({ text: pick(WIRETAP_TEXT.blackmailFoiled)(blackmailer, target, exposer), players: [blackmailer, target, exposer], badgeText: 'BLACKMAIL FOILED', badgeClass: 'red', tag: 'drama' });
    } else {
      addBond(target, blackmailer, -0.3);
      state.players[blackmailer].total += 1;
      state.players[target].total -= 1;
      state.alarm += 7;
      ep.campEvents[campKey].post.push({ text: pick(WIRETAP_TEXT.blackmailSuccess)(blackmailer, target), players: [blackmailer, target], badgeText: 'BLACKMAIL', badgeClass: 'red', tag: 'drama' });
    }
    timeline.wiretap2.push({
      type: foiled ? 'blackmail-foiled' : 'blackmail', player: blackmailer, players: [blackmailer, target, exposer].filter(Boolean),
      text: foiled ? pick(WIRETAP_TEXT.blackmailFoiled)(blackmailer, target, exposer) : pick(WIRETAP_TEXT.blackmailSuccess)(blackmailer, target),
    });
  }

  // Drama events mixed in (2-3)
  _addDramaToTimeline(active, timeline.wiretap2, ep, 2 + Math.floor(Math.random() * 2));
}

function _addDramaToTimeline(active, timelineArr, ep, count) {
  const campKey = gs.mergeName || 'merge';
  const eligible = DRAMA_EVENTS.filter(ev => ev.check(active));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  for (const ev of shuffled) {
    if (count <= 0) break;
    const applied = ev.apply(active, ep);
    if (applied) {
      ep.campEvents[campKey].post.push({ ...applied, tag: 'drama' });
      timelineArr.push({ ...applied, type: applied.badgeClass || 'warn' });
      count--;
    }
  }
}

const WIRE_COLORS = ['blue', 'red', 'green', 'yellow', 'black', 'white'];
const WIRE_CSS = { blue: '#3b82f6', red: '#ef4444', green: '#22c55e', yellow: '#eab308', black: '#64748b', white: '#e2e8f0' };

const WIRE_PICK_TEXT = {
  fashion: [
    (p, wire) => `${p} studied the wires. "Easy. ${wire.toUpperCase()} is the most fashionable." Cut.`,
    (p, wire) => `"${wire.toUpperCase()}. Obviously. It matches my outfit." ${p} didn't even hesitate.`,
  ],
  analyze: [
    (p, wire) => `${p} traced the circuit from the timer to the detonator. "${wire.toUpperCase()}. Has to be." Snip.`,
    (p, wire) => `${p} studied the panel for ten seconds. Followed the ${wire} wire to its source. "This one." Cut.`,
  ],
  gut: [
    (p, wire) => `${p} closed ${pronouns(p).posAdj} eyes, grabbed the ${wire} wire, and cut. Pure instinct.`,
    (p, wire) => `"Eeny meeny..." ${p} landed on ${wire}. "Good enough." SNIP.`,
  ],
  copy: [
    (p, wire, copiedFrom) => `${p} saw ${copiedFrom} cut ${wire} and survive. "Same wire!" ${p} snipped ${wire}. But every bomb is wired differently...`,
    (p, wire, copiedFrom) => `"If ${wire} worked for ${copiedFrom}, it'll work for me." ${p} was wrong.`,
  ],
  panic: [
    (p, wire) => `${p}'s hands were shaking too hard. Grabbed ${wire} and yanked. Not a clean cut.`,
    (p, wire) => `The timer was at 3 seconds. ${p} panicked and tore out the ${wire} wire with bare hands.`,
  ],
};
const DEFUSAL_RESULT_TEXT = {
  perfect: [
    (p, wire) => `The timer froze at 00:01. Perfect cut. ${p} exhaled. The ${wire} wire was correct.`,
    (p, wire) => `Click. Silence. The bomb went dark. ${p} didn't even flinch. Flawless.`,
  ],
  defused: [
    (p, wire) => `The ${wire} wire sparks — then the timer dies. Not pretty, but ${p} is alive.`,
    (p, wire) => `${p}'s bomb sputters, flickers, and finally stops. Close one.`,
  ],
  messy: [
    (p, wire) => `Wrong wire. Then the RIGHT wire. ${p} is covered in warning foam but technically alive.`,
    (p, wire) => `The bomb half-detonated. Foam everywhere. ${p} is soaked but the timer stopped. Barely.`,
  ],
  blast: [
    (p, wire) => `WRONG WIRE. The bomb ERUPTS. Stink bomb cloud engulfs ${p}. Everyone backs away.`,
    (p, wire) => `${p} cuts ${wire}. Nothing happens for one second. Then — BOOM. The smell is UNHOLY.`,
    (p, wire) => `The bomb goes off in ${p}'s face. Rotten eggs, old cheese, and something that might be alive. ${p} gags.`,
  ],
};

function _simulateDefusal(active, state, timeline, ep) {
  const campKey = gs.mergeName || 'merge';
  let firstDefuser = null;
  let firstWire = null;

  // Each player faces their bomb sequentially
  const order = [...active].sort(() => Math.random() - 0.5);
  for (const name of order) {
    const s = pStats(name);
    const pr = pronouns(name);
    const compromised = state.players[name].laser?.maxStep <= 1 || state.players[name].scan?.result === 'flagged';
    const intelBonus = (state.players[name].intel?.score || 0) > 0.30 ? 0.04 : 0;
    const bagBonus = (state.laserBagWinner === name && state.laserChoice?.choseSelfish) ? 0.06 : 0;

    // Wire selection — based on archetype/stats
    const correctWire = pick(WIRE_COLORS);
    let chosenWire, pickMethod;

    // Check if they copy the first defuser
    const willCopy = firstDefuser && firstWire && name !== firstDefuser && s.strategic < 6 && Math.random() < 0.4;
    if (willCopy) {
      chosenWire = firstWire; // copy — but each bomb is wired differently!
      pickMethod = 'copy';
    } else if (s.social >= 7 && s.strategic < 5) {
      // Fashion pick — social butterflies, showmancers
      chosenWire = pick(['blue', 'red', 'yellow']);
      pickMethod = 'fashion';
    } else if (s.mental >= 6 && s.strategic >= 5) {
      // Analyze — smart players more likely to pick correct
      chosenWire = Math.random() < 0.55 ? correctWire : pick(WIRE_COLORS);
      pickMethod = 'analyze';
    } else if (s.temperament <= 3) {
      // Panic — low temperament
      chosenWire = pick(WIRE_COLORS);
      pickMethod = 'panic';
    } else {
      // Gut feeling
      chosenWire = pick(WIRE_COLORS);
      pickMethod = 'gut';
    }

    // Defusal check — correct wire + stats
    const wireCorrect = chosenWire === correctWire;
    const score = s.mental * 0.02 + s.intuition * 0.01 + s.temperament * 0.01 + intelBonus + bagBonus + (compromised ? -0.06 : 0) + (wireCorrect ? 0.15 : -0.20) + (willCopy ? -0.08 : 0) + noise(0.25);
    const result = defusalResult(score);

    // Wire pick narration
    const pickText = pickMethod === 'copy'
      ? pick(WIRE_PICK_TEXT.copy)(name, chosenWire, firstDefuser)
      : pick(WIRE_PICK_TEXT[pickMethod])(name, chosenWire);

    // Result narration
    const resultText = pick(DEFUSAL_RESULT_TEXT[result])(name, chosenWire);

    let delta = result === 'perfect' ? 4 : result === 'defused' ? 2 : result === 'messy' ? -1 : -3;
    state.players[name].defusal = { score, result, wire: chosenWire, correctWire, pickMethod, wireCorrect };
    state.players[name].total += delta;
    if (result === 'messy') state.alarm += 8;
    if (result === 'blast') state.alarm += 18;
    if (!ep.chalMemberScores) ep.chalMemberScores = {};
    ep.chalMemberScores[name] = Math.round(state.players[name].total);

    // Track first successful defuser for copycat mechanic
    if (!firstDefuser && (result === 'perfect' || result === 'defused')) {
      firstDefuser = name;
      firstWire = chosenWire;
    }

    timeline.defusal.push({
      type: result, player: name, score,
      wire: chosenWire, correctWire, pickMethod, wireCorrect,
      pickText, resultText,
      text: `${pickText} ${resultText}`,
    });

    // Inline reactions
    if (result === 'perfect' && Math.random() < 0.5) {
      const reactor = Math.random() < 0.4 ? host() : pick(active.filter(n => n !== name));
      if (reactor) {
        timeline.defusal.push({ type: 'reaction', player: name,
          text: pick(INLINE_REACTIONS.defusalPerfectReact)(reactor, name) });
      }
    } else if (result === 'blast') {
      const reactor = Math.random() < 0.5 ? host() : pick(active.filter(n => n !== name));
      if (reactor) {
        timeline.defusal.push({ type: 'reaction', player: name,
          text: pick(INLINE_REACTIONS.defusalBlastReact)(reactor, name) });
      }
      // Copycat blame event
      if (willCopy && firstDefuser) {
        addBond(name, firstDefuser, -0.3);
        timeline.defusal.push({ type: 'reaction', players: [name, firstDefuser],
          text: `"I copied YOUR wire!" ${name} pointed at ${firstDefuser}. "Every bomb is wired DIFFERENTLY, genius!" Trust broken.` });
      }
    }
  }

  // Rank and determine winner
  const ranked = active.map(name => ({ name, score: state.players[name].total })).sort((a, b) => b.score - a.score);
  let winner = ranked[0]?.name || active[0];
  const runnerUp = ranked[1]?.name || null;
  const tieDiff = runnerUp ? Math.abs(ranked[0].score - ranked[1].score) : Infinity;
  let extraImmune = null;
  let tiebreak = null;
  if (runnerUp && tieDiff < 0.5) {
    if (tieDiff < 0.2) {
      extraImmune = runnerUp;
    } else {
      const a = ranked[0].name, b = ranked[1].name;
      const sa = pStats(a), sb = pStats(b);
      const scoreA = sa.mental * 0.04 + sa.intuition * 0.03 + noise(0.3);
      const scoreB = sb.mental * 0.04 + sb.intuition * 0.03 + noise(0.3);
      winner = scoreA >= scoreB ? a : b;
      tiebreak = { players: [a, b], scores: { [a]: scoreA, [b]: scoreB }, winner };
    }
  }
  state.final = { ranked, winner, runnerUp, tieDiff, extraImmune, tiebreak };
  if (winner) popDelta(winner, 2);
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export function simulateOperationClassified(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const state = {
    title: 'Operation: Classified', host: host(),
    players: {}, alarm: 0, alliancePitch: null, blackmail: null, final: null,
  };
  const timeline = { scan: [], wiretap1: [], laser: [], wiretap2: [], defusal: [] };
  active.forEach(name => { state.players[name] = { total: 0 }; });

  _simulateScan(active, state, timeline);
  _simulateWiretap1(active, state, timeline, ep);
  _simulateLaser(active, state, timeline, ep);
  _simulateWiretap2(active, state, timeline, ep);
  _simulateDefusal(active, state, timeline, ep);

  const ranked = state.final.ranked;
  ep.isOperationClassified = true;
  ep.operationClassified = { ...state, activePlayers: active, timeline, alarm: Math.round(state.alarm), leaderboard: ranked };
  ep.challengeType = 'operation-classified';
  ep.challengeLabel = 'Operation: Classified';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = state.final.winner;
  if (state.final.extraImmune) ep.extraImmune = [...(ep.extraImmune || []), state.final.extraImmune];
  ep.chalPlacements = ranked.map(r => r.name);
  ep.challengePlacements = ranked.map((r, i) => ({ name: r.name, place: i + 1, score: r.score }));
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  ranked.forEach(r => { ep.chalMemberScores[r.name] = Math.round(r.score); });
  ep.tribalPlayers = active;
}

// ══════════════════════════════════════════════════════════════
// VP — CSS
// ══════════════════════════════════════════════════════════════
function css() {
  return `<style>
  .oc-shell{--oc-red:#ff2d2d;--oc-green:#22c55e;--oc-amber:#f59e0b;--oc-steel:#94a3b8;--oc-ink:#050607;
    position:relative;overflow:clip;background:#050607;color:#e5e7eb;
    border:2px solid rgba(255,255,255,.08);border-radius:6px;
    max-width:1100px;margin:0 auto;
    font-family:Inter,Arial,sans-serif;min-height:400px}
  .oc-shell::before{content:'';position:absolute;inset:0;
    background:repeating-linear-gradient(0deg,rgba(255,255,255,.02) 0 1px,transparent 1px 4px),
    radial-gradient(circle at 30% 10%,rgba(255,45,45,.08),transparent 40%);
    pointer-events:none;z-index:0}
  /* Laser sweep animation */
  .oc-shell::after{content:'';position:absolute;top:0;left:-100%;width:200%;height:2px;
    background:linear-gradient(90deg,transparent,rgba(255,45,45,0.4),transparent);
    pointer-events:none;z-index:1;animation:oc-laser-sweep 4s linear infinite}
  @keyframes oc-laser-sweep{0%{transform:translateX(-30%) translateY(80px)}50%{transform:translateX(20%) translateY(200px)}100%{transform:translateX(-30%) translateY(80px)}}

  .oc-head{position:relative;z-index:5;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(255,255,255,.1);padding:18px;margin-bottom:0}
  .oc-kicker{font:700 10px/1 'Share Tech Mono',monospace;letter-spacing:3px;color:var(--oc-red);text-transform:uppercase}
  .oc-title{font-family:'Bungee Shade',sans-serif;font-size:28px;letter-spacing:2px;text-transform:uppercase;color:#fff;text-shadow:0 0 18px rgba(255,45,45,.25)}
  .oc-sub{font-size:11px;color:rgba(229,231,235,.5);max-width:600px;line-height:1.5;margin-top:6px}

  .oc-layout{position:relative;z-index:5;display:flex;gap:0;min-height:300px}
  .oc-feed{flex:1;padding:14px 18px;min-width:0}
  .oc-sidebar{width:260px;flex-shrink:0;padding:12px 14px;background:rgba(12,16,20,.7);
    border-left:1px solid rgba(255,255,255,.06);position:sticky;top:0;align-self:flex-start;max-height:80vh;overflow-y:auto}
  .oc-side-title{font:700 10px/1 'Share Tech Mono',monospace;color:var(--oc-amber);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;padding:6px 0 4px;border-bottom:1px solid rgba(255,255,255,.06)}

  .oc-metric{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:11px;color:rgba(229,231,235,.6)}
  .oc-metric b{font-family:'Share Tech Mono',monospace;color:#fff}
  .oc-agent{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.03);font-size:11px}
  .oc-agent .name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .oc-chip{font:700 8px/1 'Share Tech Mono',monospace;letter-spacing:1px;padding:3px 5px;border:1px solid rgba(255,255,255,.1);border-radius:3px;color:var(--oc-steel)}
  .oc-chip.clear,.oc-chip.perfect,.oc-chip.defused,.oc-chip.ghost{color:var(--oc-green);border-color:rgba(34,197,94,.3);background:rgba(34,197,94,.06)}
  .oc-chip.flagged,.oc-chip.hit,.oc-chip.blast{color:var(--oc-red);border-color:rgba(255,45,45,.3);background:rgba(255,45,45,.06)}
  .oc-chip.alarm,.oc-chip.messy,.oc-chip.watched{color:var(--oc-amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06)}

  .oc-event{display:flex;gap:10px;align-items:flex-start;margin:6px 0;padding:10px 12px;
    background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-left:3px solid var(--oc-steel);border-radius:4px}
  .oc-event[data-tone=good]{border-left-color:var(--oc-green)}.oc-event[data-tone=bad]{border-left-color:var(--oc-red)}.oc-event[data-tone=warn]{border-left-color:var(--oc-amber)}
  .oc-port{display:inline-grid;place-items:center;flex:0 0 auto;border:1px solid rgba(255,255,255,.15);background:#111;border-radius:50%;overflow:hidden}
  .oc-port img{width:100%;height:100%;object-fit:cover}
  .oc-copy{font-size:12px;line-height:1.55;color:rgba(245,245,245,.8)}
  .oc-score{margin-left:auto;font:700 11px 'Share Tech Mono',monospace;color:var(--oc-green);flex-shrink:0}

  /* Bomb timer animation */
  .oc-bomb-timer{display:inline-block;font-family:'Share Tech Mono',monospace;font-size:14px;color:var(--oc-red);
    animation:oc-blink 0.8s ease-in-out infinite}
  @keyframes oc-blink{0%,100%{opacity:1}50%{opacity:0.3}}

  /* ── SCAN CARD — spy ID badge ── */
  .oc-scan-card{display:flex;gap:0;background:#0a0e14;border:2px solid rgba(59,130,246,0.2);border-radius:8px;overflow:hidden;max-width:500px;margin:8px auto}
  .oc-scan-photo{width:140px;flex-shrink:0;position:relative;background:#080c12;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:8px}
  .oc-scan-photo img{width:100%;height:auto;object-fit:contain}
  /* Corner brackets like face detection */
  .oc-scan-photo::before{content:'';position:absolute;inset:8px;
    border:2px solid rgba(59,130,246,0.3);border-radius:2px;
    clip-path:polygon(0 0,25% 0,25% 2px,2px 2px,2px 25%,0 25%,0 0,75% 0,75% 0,100% 0,100% 25%,calc(100% - 2px) 25%,calc(100% - 2px) 2px,75% 2px,75% 0,0 75%,0 75%,0 100%,25% 100%,25% calc(100% - 2px),2px calc(100% - 2px),2px 75%,0 75%,100% 75%,100% 75%,100% 100%,75% 100%,75% calc(100% - 2px),calc(100% - 2px) calc(100% - 2px),calc(100% - 2px) 75%,100% 75%);
    pointer-events:none;z-index:2}
  /* Scan line sweeping top to bottom */
  .oc-scan-photo::after{content:'';position:absolute;left:0;right:0;height:3px;
    background:linear-gradient(180deg,transparent,rgba(59,130,246,0.6),rgba(59,130,246,0.8),rgba(59,130,246,0.6),transparent);
    box-shadow:0 0 12px 3px rgba(59,130,246,0.3);
    pointer-events:none;z-index:3;animation:oc-scanline-sweep 2s ease-in-out infinite}
  @keyframes oc-scanline-sweep{0%{top:-3px}50%{top:calc(100% + 3px)}50.01%{top:-3px}100%{top:calc(100% + 3px)}}

  .oc-scan-data{flex:1;padding:10px 14px;display:flex;flex-direction:column;gap:4px}
  .oc-scan-header{font:700 8px/1 'Share Tech Mono',monospace;letter-spacing:3px;color:rgba(59,130,246,0.5);text-transform:uppercase;margin-bottom:2px}
  .oc-scan-name{font:700 16px/1 'Share Tech Mono',monospace;color:#fff;letter-spacing:1px}
  .oc-scan-field{display:flex;justify-content:space-between;font:11px/1.3 'Share Tech Mono',monospace;padding:2px 0;border-bottom:1px solid rgba(59,130,246,0.06)}
  .oc-scan-field .label{color:rgba(59,130,246,0.4);letter-spacing:1px;font-size:9px}
  .oc-scan-field .val{color:rgba(255,255,255,0.7);letter-spacing:1px}
  /* Typewriter effect for data fields */
  .oc-scan-field .val{overflow:hidden;white-space:nowrap;border-right:2px solid rgba(59,130,246,0.5);
    animation:oc-type 1.2s steps(16) forwards,oc-blink-caret 0.6s step-end 3}
  @keyframes oc-type{0%{width:0}100%{width:100%;border-right-color:transparent}}
  @keyframes oc-blink-caret{50%{border-right-color:transparent}}

  .oc-scan-status{margin-top:4px;font:700 11px/1 'Share Tech Mono',monospace;letter-spacing:2px;padding:5px 8px;border-radius:3px;text-align:center}
  .oc-scan-status.clear{color:var(--oc-green);border:1px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.08)}
  .oc-scan-status.watched{color:var(--oc-amber);border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.08)}
  .oc-scan-status.flagged{color:var(--oc-red);border:1px solid rgba(255,45,45,0.3);background:rgba(255,45,45,0.08);animation:oc-alert-flash 0.8s ease-in-out 2}
  @keyframes oc-alert-flash{0%,100%{background:rgba(255,45,45,0.08)}50%{background:rgba(255,45,45,0.2)}}

  .oc-scan-narrative{font-size:11px;color:rgba(255,255,255,0.5);font-style:italic;margin-top:4px;line-height:1.4}

  /* ── LASER VAULT CARD — security cam feed ── */
  .oc-laser-card{display:flex;gap:0;background:#060810;border:2px solid rgba(255,45,45,0.15);border-radius:6px;overflow:hidden;max-width:500px;margin:8px auto;position:relative}
  .oc-laser-feed{width:110px;flex-shrink:0;position:relative;background:#030408;overflow:hidden;display:flex;align-items:center;justify-content:center}
  .oc-laser-feed img{width:100%;height:auto;object-fit:contain;padding:6px;position:relative;z-index:2}
  /* Laser grid overlay on the photo */
  .oc-laser-feed::before{content:'';position:absolute;inset:0;z-index:3;pointer-events:none;
    background:
      linear-gradient(0deg,transparent 30%,rgba(255,45,45,0.12) 30.5%,rgba(255,45,45,0.12) 31%,transparent 31.5%,
        transparent 55%,rgba(255,45,45,0.08) 55.5%,rgba(255,45,45,0.08) 56%,transparent 56.5%,
        transparent 78%,rgba(255,45,45,0.1) 78.5%,rgba(255,45,45,0.1) 79%,transparent 79.5%),
      linear-gradient(90deg,transparent 25%,rgba(255,45,45,0.06) 25.5%,rgba(255,45,45,0.06) 26%,transparent 26.5%,
        transparent 70%,rgba(255,45,45,0.08) 70.5%,rgba(255,45,45,0.08) 71%,transparent 71.5%)}
  /* Criss-crossing laser beams inside the vault */
  .oc-laser-feed::after{content:'';position:absolute;inset:0;z-index:4;pointer-events:none;
    background:
      linear-gradient(35deg,transparent 46%,rgba(255,45,45,0.5) 49.5%,rgba(255,80,80,0.8) 50%,rgba(255,45,45,0.5) 50.5%,transparent 54%),
      linear-gradient(145deg,transparent 46%,rgba(255,45,45,0.3) 49.5%,rgba(255,60,60,0.6) 50%,rgba(255,45,45,0.3) 50.5%,transparent 54%);
    background-size:100% 100%;animation:oc-laser-shift 3s ease-in-out infinite alternate}
  @keyframes oc-laser-shift{0%{background-position:0 -10px,-5px 0}100%{background-position:0 10px,5px 0}}

  /* REC indicator */
  .oc-laser-rec{position:absolute;top:6px;left:6px;z-index:5;font:700 7px/1 'Share Tech Mono',monospace;
    color:var(--oc-red);letter-spacing:1px;display:flex;align-items:center;gap:3px}
  .oc-laser-rec::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--oc-red);
    animation:oc-rec-blink 1.2s ease-in-out infinite}
  @keyframes oc-rec-blink{0%,100%{opacity:1}50%{opacity:0.2}}

  .oc-laser-data{flex:1;padding:10px 14px;display:flex;flex-direction:column;gap:3px}
  .oc-laser-header{font:700 8px/1 'Share Tech Mono',monospace;letter-spacing:3px;color:rgba(255,45,45,0.4);text-transform:uppercase}
  .oc-laser-name{font:700 15px/1 'Share Tech Mono',monospace;color:#fff;letter-spacing:1px}
  .oc-laser-result{font:700 10px/1 'Share Tech Mono',monospace;letter-spacing:2px;padding:4px 8px;border-radius:3px;text-align:center;margin-top:4px}
  .oc-laser-result.ghost{color:var(--oc-green);border:1px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.06)}
  .oc-laser-result.clean{color:var(--oc-green);border:1px solid rgba(34,197,94,0.2);background:rgba(34,197,94,0.04)}
  .oc-laser-result.alarm{color:var(--oc-amber);border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.06);animation:oc-alarm-strobe 0.6s ease-out 2}
  .oc-laser-result.hit{color:var(--oc-red);border:1px solid rgba(255,45,45,0.3);background:rgba(255,45,45,0.08);animation:oc-alarm-strobe 0.4s ease-out 3}
  @keyframes oc-alarm-strobe{0%,100%{background:rgba(255,45,45,0.08)}50%{background:rgba(255,45,45,0.25)}}
  .oc-laser-narrative{font-size:11px;color:rgba(255,255,255,0.5);font-style:italic;margin-top:4px;line-height:1.4}

  /* ── WIRETAP CARD — intercepted transmission ── */
  .oc-wire-card{background:#060a08;border:1px solid rgba(34,197,94,0.15);border-radius:6px;overflow:hidden;max-width:500px;margin:8px auto;position:relative}
  /* Scanline overlay */
  .oc-wire-card::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(34,197,94,0.015) 2px,rgba(34,197,94,0.015) 4px);
    animation:oc-wire-scan 6s linear infinite}
  @keyframes oc-wire-scan{0%{background-position:0 0}100%{background-position:0 100px}}

  .oc-wire-header{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid rgba(34,197,94,0.08);position:relative;z-index:2}
  .oc-wire-signal{width:8px;height:8px;border-radius:50%;background:var(--oc-green);animation:oc-rec-blink 1.5s ease-in-out infinite}
  .oc-wire-label{font:700 9px/1 'Share Tech Mono',monospace;letter-spacing:2px;color:rgba(34,197,94,0.5)}
  .oc-wire-body{padding:10px 14px;position:relative;z-index:2;display:flex;align-items:flex-start;gap:10px}
  .oc-wire-portraits{display:flex;gap:4px;flex-shrink:0}
  .oc-wire-text{font-size:12px;line-height:1.55;color:rgba(34,197,94,0.75);font-family:'Share Tech Mono',monospace}
  .oc-wire-type{font:700 9px/1 'Share Tech Mono',monospace;letter-spacing:2px;padding:3px 6px;border-radius:2px;margin-top:6px;display:inline-block}
  .oc-wire-type.intel{color:var(--oc-green);border:1px solid rgba(34,197,94,0.2);background:rgba(34,197,94,0.05)}
  .oc-wire-type.alliance{color:#60a5fa;border:1px solid rgba(96,165,250,0.3);background:rgba(96,165,250,0.06)}
  .oc-wire-type.alliance-fail{color:var(--oc-amber);border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.05)}
  .oc-wire-type.blackmail{color:var(--oc-red);border:1px solid rgba(255,45,45,0.2);background:rgba(255,45,45,0.05)}
  .oc-wire-type.blackmail-foiled{color:var(--oc-amber);border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.06)}

  .oc-controls{text-align:center;margin-top:14px;position:relative;z-index:5}
  .oc-btn{border:1px solid rgba(255,45,45,.4);background:linear-gradient(180deg,#1a0508,#0d0304);color:#fff;border-radius:4px;
    padding:10px 20px;font:700 11px 'Share Tech Mono',monospace;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all 0.2s}
  .oc-btn:hover{background:#2a0a10;box-shadow:0 0 12px rgba(255,45,45,.2)}
  .oc-btn.secondary{border-color:rgba(148,163,184,.3);background:#0a0c10;color:var(--oc-steel);margin-left:8px}

  .oc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:16px;padding:0 10px}

  /* Manila folder dossier */
  .oc-folder{position:relative;background:linear-gradient(160deg,#c4a265 0%,#d4b477 40%,#bfa05a 100%);
    border-radius:2px 8px 4px 4px;padding:12px 10px 10px;min-height:140px;
    box-shadow:2px 3px 8px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.15);
    display:flex;flex-direction:column;align-items:center;cursor:default}
  /* Folder tab */
  .oc-folder::before{content:'';position:absolute;top:-8px;left:10px;width:40px;height:10px;
    background:linear-gradient(180deg,#d4b477,#c4a265);border-radius:3px 3px 0 0;
    box-shadow:1px -1px 3px rgba(0,0,0,0.15)}
  /* Paper edge peeking out */
  .oc-folder::after{content:'';position:absolute;top:3px;right:4px;width:calc(100% - 14px);height:calc(100% - 10px);
    background:#f0ead6;border-radius:1px;z-index:0;box-shadow:inset 0 0 4px rgba(0,0,0,0.05)}

  .oc-folder-content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;width:100%}
  .oc-folder-photo{width:56px;height:56px;border:2px solid rgba(0,0,0,0.2);background:#ddd;overflow:hidden;margin-bottom:6px}
  .oc-folder-photo img{width:100%;height:100%;object-fit:contain}
  .oc-folder-name{font:700 11px/1.2 'Share Tech Mono',monospace;color:#1a1a1a;text-align:center;
    margin-bottom:6px;letter-spacing:0.5px}
  .oc-folder-stamp{font:900 9px/1 'Share Tech Mono',monospace;letter-spacing:2px;
    padding:3px 8px;border:2px solid;border-radius:2px;transform:rotate(-3deg);text-transform:uppercase}
  .oc-folder-stamp.pending{color:#8b6914;border-color:#8b6914;background:rgba(139,105,20,0.08)}
  .oc-folder-stamp.mission{color:#b91c1c;border-color:#b91c1c;background:rgba(185,28,28,0.08)}
  .oc-folder-stamp.mission-success{color:#15803d;border-color:#15803d;background:rgba(21,128,61,0.08)}
  .oc-folder-stamp.mission-failed{color:#b91c1c;border-color:#b91c1c;background:rgba(185,28,28,0.08)}
  .oc-folder-stamp.mission-complete{color:#8b6914;border-color:#8b6914;background:rgba(139,105,20,0.06)}

  .oc-winner{text-align:center;padding:28px 14px;position:relative;z-index:5}
  .oc-winner .name{font-family:'Bungee Shade',sans-serif;font-size:28px;letter-spacing:3px;color:#fff;text-shadow:0 0 20px rgba(255,45,45,.2)}
  .oc-stamp{display:inline-block;margin-top:10px;border:2px solid var(--oc-green);color:var(--oc-green);padding:6px 12px;
    font:900 12px 'Share Tech Mono',monospace;letter-spacing:2px;transform:rotate(-2deg)}

  /* Drama break */
  .oc-drama{border-left:3px dashed rgba(245,158,11,.2);background:rgba(245,158,11,.02);font-style:italic}

  /* ── BOMB DEFUSAL CARD ── */
  .oc-bomb-card{background:#0a0406;border:2px solid rgba(255,45,45,0.15);border-radius:6px;overflow:hidden;max-width:500px;margin:8px auto;position:relative}
  .oc-bomb-header{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid rgba(255,45,45,0.08)}
  .oc-bomb-timer-display{font:700 16px/1 'Share Tech Mono',monospace;color:var(--oc-red);animation:oc-blink 0.8s ease-in-out infinite}
  .oc-bomb-wires{display:flex;gap:3px;padding:6px 12px;background:rgba(0,0,0,0.3)}
  .oc-wire{height:4px;flex:1;border-radius:2px;position:relative;transition:all 0.3s}
  .oc-wire.cut{opacity:0.2}
  .oc-wire.cut::after{content:'✂';position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:10px}
  .oc-wire.chosen{height:6px;box-shadow:0 0 8px currentColor}
  .oc-bomb-body{padding:10px 14px;display:flex;align-items:flex-start;gap:10px}
  .oc-bomb-result{font:700 10px/1 'Share Tech Mono',monospace;letter-spacing:2px;padding:4px 8px;border-radius:3px;text-align:center;margin-top:6px}
  .oc-bomb-result.perfect,.oc-bomb-result.defused{color:var(--oc-green);border:1px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.06)}
  .oc-bomb-result.messy{color:var(--oc-amber);border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.06)}
  .oc-bomb-result.blast{color:var(--oc-red);border:1px solid rgba(255,45,45,0.3);background:rgba(255,45,45,0.08)}

  /* Blast — full card shake + red flash */
  .oc-bomb-card.blast-card{animation:oc-bomb-shake 0.5s ease-out}
  @keyframes oc-bomb-shake{0%{transform:translateX(0)}10%{transform:translateX(-6px)}20%{transform:translateX(6px)}30%{transform:translateX(-5px)}40%{transform:translateX(5px)}50%{transform:translateX(-3px)}60%{transform:translateX(3px)}70%{transform:translateX(-1px)}100%{transform:translateX(0)}}

  /* Blast — expanding red ring */
  .oc-bomb-boom{position:absolute;top:50%;left:50%;width:0;height:0;border-radius:50%;
    border:3px solid rgba(255,45,45,0.5);transform:translate(-50%,-50%);
    pointer-events:none;z-index:2;animation:oc-boom-ring 0.8s ease-out forwards}
  @keyframes oc-boom-ring{0%{width:0;height:0;opacity:0.8;border-width:4px}100%{width:250px;height:250px;opacity:0;border-width:1px}}

  /* Stink cloud on blast */
  .oc-bomb-stink{position:absolute;inset:0;pointer-events:none;z-index:1;
    background:radial-gradient(circle at 50% 50%,rgba(120,100,20,0.2),transparent 60%);
    animation:oc-stink-cloud 1.5s ease-out forwards}
  @keyframes oc-stink-cloud{0%{opacity:0;transform:scale(0.3)}30%{opacity:1}100%{opacity:0;transform:scale(2.5)}}

  /* Messy — amber foam splash */
  .oc-bomb-card.messy-card{animation:oc-messy-wobble 0.4s ease-out}
  @keyframes oc-messy-wobble{0%{transform:rotate(0)}25%{transform:rotate(1deg)}50%{transform:rotate(-1deg)}75%{transform:rotate(0.5deg)}100%{transform:rotate(0)}}
  .oc-bomb-foam{position:absolute;inset:0;pointer-events:none;z-index:1;
    background:radial-gradient(circle at 40% 60%,rgba(245,158,11,0.12),transparent 50%);
    animation:oc-foam-splash 1s ease-out forwards}
  @keyframes oc-foam-splash{0%{opacity:0;transform:scale(0.5)}20%{opacity:0.8}100%{opacity:0;transform:scale(1.8)}}

  @media(prefers-reduced-motion:reduce){
    .oc-shell::after,.oc-bomb-timer,.oc-scan-photo::after,
    .oc-scan-field .val,.oc-scan-status.flagged,
    .oc-laser-feed::after,.oc-laser-rec::before,
    .oc-wire-card::before,.oc-wire-signal,
    .oc-bomb-timer-display,.blast-card,.messy-card,.oc-bomb-boom,.oc-bomb-stink,.oc-bomb-foam{animation:none!important}
    .oc-scan-field .val{width:100%!important;border-right:none!important}
  }
  @media(max-width:760px){.oc-layout{flex-direction:column}.oc-sidebar{width:100%}.oc-title{font-size:22px}}
  </style>`;
}

// ══════════════════════════════════════════════════════════════
// VP — SCREENS
// ══════════════════════════════════════════════════════════════
function shell(ep, body, screenKey, events = []) {
  const oc = ep.operationClassified;
  const stateKey = `oc-${ep.num}-${screenKey}`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;
  return `${css()}
  <link href="https://fonts.googleapis.com/css2?family=Bungee+Shade&family=Share+Tech+Mono&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <div class="oc-shell">
    <div class="oc-head"><div><div class="oc-kicker">Mission Control // ${host()}</div><div class="oc-title">Operation: Classified</div><div class="oc-sub">Face scans. Laser vault. Wiretap blackmail. Bomb defusal. One wins immunity.</div></div><div class="oc-chip">POST-MERGE</div></div>
    <div class="oc-layout"><div class="oc-feed">${body}</div><div class="oc-sidebar" id="oc-sidebar-${stateKey}">${buildSidebar(oc, screenKey, revIdx, events)}</div></div>
  </div>`;
}

function eventTone(type) {
  if (['clear', 'ghost', 'clean', 'perfect', 'defused', 'alliance', 'intel'].includes(type)) return 'good';
  if (['flagged', 'hit', 'blast', 'blackmail-foiled'].includes(type)) return 'bad';
  return 'warn';
}

function renderSteps(ep, screenKey, events, btnLabel) {
  const stateKey = `oc-${ep.num}-${screenKey}`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const state = window._tvState[stateKey];
  let html = '';
  events.forEach((ev, i) => {
    const visible = i <= state.idx;
    const imgs = (ev.players || [ev.player]).filter(Boolean).slice(0, 3).map(p => portrait(p, 36)).join('');
    html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
      <div class="oc-event ${ev.type === 'confessional' || ev.type === 'reaction' || ev.badgeText ? 'oc-drama' : ''}" data-tone="${eventTone(ev.type)}">
        <div style="display:flex;gap:4px">${imgs}</div>
        <div class="oc-copy">${ev.text}</div>
      </div>
    </div>`;
  });
  const done = state.idx >= events.length - 1;
  html += `<div id="oc-controls-${stateKey}" class="oc-controls" ${done ? 'style="display:none"' : ''}>
    <button class="oc-btn" onclick="operationClassifiedRevealNext('${stateKey}',${events.length},'${screenKey}')">${btnLabel}</button>
    <button class="oc-btn secondary" onclick="operationClassifiedRevealAll('${stateKey}',${events.length},'${screenKey}')">Reveal All</button>
  </div>`;
  return html;
}

function buildSidebar(oc, screenKey, revIdx, events = []) {
  const revealed = events.slice(0, Math.max(0, revIdx + 1));
  const statusBy = {};
  revealed.forEach(ev => { if (ev.player && ev.type !== 'reaction') statusBy[ev.player] = ev.type; });
  const alarmPct = events.length ? Math.min(99, Math.round((oc.alarm || 0) * Math.max(0, (revIdx + 1) / Math.max(1, events.length)))) : 0;
  const leaderRevealed = screenKey === 'debrief' || (revIdx >= 0 && screenKey === 'defusal');

  let html = `<div class="oc-side-title">Mission Control</div>
    <div class="oc-metric"><span>Alarm Level</span><b style="color:${alarmPct > 60 ? 'var(--oc-red)' : alarmPct > 30 ? 'var(--oc-amber)' : 'var(--oc-green)'}">${alarmPct}%</b></div>
    <div class="oc-metric"><span>Agents Active</span><b>${oc.activePlayers?.length || 0}</b></div>
    ${leaderRevealed ? `<div class="oc-metric"><span>Immunity Lead</span><b style="color:var(--oc-green)">${oc.final?.winner || '???'}</b></div>` : ''}`;

  // Laser phase — position map
  if (screenKey === 'laser' && oc.laserRounds?.length) {
    // Find the latest position snapshot from revealed events
    let latestPositions = {};
    (oc.activePlayers || []).forEach(n => { latestPositions[n] = 0; });
    for (const rd of oc.laserRounds) {
      // Check if any event from this round has been revealed
      const roundFirstIdx = events.findIndex(e => e.type === 'turn-label' && e.text.includes(`TURN ${rd.turn}`));
      if (roundFirstIdx >= 0 && roundFirstIdx <= revIdx) {
        latestPositions = { ...rd.positions };
      }
    }

    html += `<div class="oc-side-title">Vault Position</div>`;
    // Step labels
    html += `<div style="display:flex;gap:2px;margin-bottom:6px;font:700 7px/1 'Share Tech Mono',monospace;color:rgba(255,255,255,0.2)">`;
    for (let s = 0; s <= LASER_STEPS; s++) {
      html += `<div style="flex:1;text-align:center">${s === LASER_STEPS ? '💼' : s}</div>`;
    }
    html += `</div>`;

    // Position bars per player, sorted by position
    const sorted = (oc.activePlayers || []).sort((a, b) => (latestPositions[b] || 0) - (latestPositions[a] || 0));
    for (const name of sorted) {
      const pos = latestPositions[name] || 0;
      const pct = Math.round((pos / LASER_STEPS) * 100);
      const atBag = pos >= LASER_STEPS;
      const barColor = atBag ? 'var(--oc-green)' : pos > 0 ? 'var(--oc-amber)' : 'rgba(255,255,255,0.1)';
      html += `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:9px">
        ${portrait(name, 16)}
        <div style="flex:1">
          <div style="height:4px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${barColor};border-radius:2px;transition:width 0.3s"></div>
          </div>
        </div>
        <span style="font-family:'Share Tech Mono',monospace;color:${barColor};width:16px;text-align:right">${atBag ? '💼' : pos}</span>
      </div>`;
    }
  } else {
    // Default agent status
    html += `<div class="oc-side-title">Agent Status</div>`;
    (oc.activePlayers || []).forEach(name => {
      const st = statusBy[name] || 'pending';
      html += `<div class="oc-agent">${portrait(name, 22)}<span class="name">${name}</span><span class="oc-chip ${st}">${st.toUpperCase()}</span></div>`;
    });
  }
  return html;
}

export function rpBuildOperationClassifiedTitleCard(ep) {
  const oc = ep.operationClassified;
  const folders = (oc.activePlayers || []).map(name => {
    const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
    return `<div class="oc-folder">
      <div class="oc-folder-content">
        <div class="oc-folder-photo"><img src="assets/avatars/${slug}.png" onerror="this.style.display='none'" alt="${name}"></div>
        <div class="oc-folder-name">${name}</div>
        <div class="oc-folder-stamp mission">IN MISSION</div>
      </div>
    </div>`;
  }).join('');
  return shell(ep, `
    <div class="oc-winner">
      <div class="oc-kicker">Unauthorized Broadcast Captured</div>
      <div class="name">Operation: Classified</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:8px;font-family:'Share Tech Mono',monospace;letter-spacing:1px">Face Scan · Laser Vault · Wiretap · Bomb Defusal</div>
      <div class="oc-stamp">TOP SECRET</div>
    </div>
    <div class="oc-grid">${folders}</div>
  `, 'title', []);
}

export function rpBuildOperationClassifiedScan(ep) {
  const events = ep.operationClassified.timeline.scan || [];
  const stateKey = `oc-${ep.num}-scan`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const state = window._tvState[stateKey];

  let html = '';
  events.forEach((ev, i) => {
    const visible = i <= state.idx;

    // Inline reaction — render as simple commentary card
    if (ev.type === 'reaction') {
      const ppl = (ev.players || [ev.player]).filter(Boolean);
      html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
        <div class="oc-event oc-drama" data-tone="warn" style="padding:10px 14px;max-width:500px;margin:4px auto">
          <div style="display:flex;gap:4px">${ppl.map(p => portrait(p, 28)).join('')}</div>
          <div class="oc-copy" style="font-style:italic">${ev.text}</div>
        </div>
      </div>`;
      return;
    }

    const resultLabel = ev.type === 'clear' ? 'CLEARANCE GRANTED' : ev.type === 'watched' ? 'UNDER SURVEILLANCE' : 'INTRUDER FLAGGED';
    const slug = players.find(p => p.name === ev.player)?.slug || ev.player.toLowerCase().replace(/\s+/g, '-');
    const agentNum = `AG-${String(Math.abs(ev.player.charCodeAt(0) * 37 + ev.player.length * 89) % 9000 + 1000)}`;
    const clearance = ev.type === 'clear' ? 'LEVEL 9 — TOP SECRET' : ev.type === 'watched' ? 'LEVEL 4 — RESTRICTED' : 'LEVEL 0 — DENIED';
    html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
      <div class="oc-scan-card">
        <div class="oc-scan-photo">
          <img src="assets/avatars/${slug}.png" onerror="this.style.display='none'" alt="${ev.player}">
        </div>
        <div class="oc-scan-data">
          <div class="oc-scan-header">CLASSIFIED DOSSIER</div>
          <div class="oc-scan-name">${ev.player}</div>
          <div class="oc-scan-field"><span class="label">AGENT #</span><span class="val">${agentNum}</span></div>
          <div class="oc-scan-field"><span class="label">CLEARANCE</span><span class="val">${clearance}</span></div>
          <div class="oc-scan-field"><span class="label">THREAT</span><span class="val">${ev.type === 'flagged' ? 'HIGH' : ev.type === 'watched' ? 'MODERATE' : 'NONE'}</span></div>
          <div class="oc-scan-status ${ev.type}">${resultLabel}</div>
          <div class="oc-scan-narrative">${ev.text}</div>
        </div>
      </div>
    </div>`;
  });

  const done = state.idx >= events.length - 1;
  html += `<div id="oc-controls-${stateKey}" class="oc-controls" ${done ? 'style="display:none"' : ''}>
    <button class="oc-btn" onclick="operationClassifiedRevealNext('${stateKey}',${events.length},'scan')">Scan Next</button>
    <button class="oc-btn secondary" onclick="operationClassifiedRevealAll('${stateKey}',${events.length},'scan')">Reveal All</button>
  </div>`;

  return shell(ep, html, 'scan', events);
}
export function rpBuildOperationClassifiedLaser(ep) {
  const events = ep.operationClassified.timeline.laser || [];
  const oc = ep.operationClassified;
  const stateKey = `oc-${ep.num}-laser`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const state = window._tvState[stateKey];

  let html = '';
  events.forEach((ev, i) => {
    const visible = i <= state.idx;
    const ppl = (ev.players || [ev.player]).filter(Boolean);

    if (ev.type === 'turn-label') {
      html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
        <div style="text-align:center;padding:8px 0;font:700 10px/1 'Share Tech Mono',monospace;letter-spacing:3px;color:rgba(255,45,45,0.4)">${ev.text}</div>
      </div>`;
    } else if (ev.type === 'advance') {
      const stepPct = Math.round((ev.step / LASER_STEPS) * 100);
      html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
        <div class="oc-event" data-tone="good" style="padding:8px 12px">
          <div style="display:flex;align-items:center;gap:8px;width:100%">
            ${portrait(ev.player, 28)}
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <span style="font:700 11px/1 'Share Tech Mono',monospace;color:#fff">${ev.player}</span>
                <span style="font:700 9px/1 'Share Tech Mono',monospace;color:var(--oc-green);letter-spacing:1px">STEP ${ev.step}/${LASER_STEPS}</span>
              </div>
              <div style="height:5px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden;margin-bottom:4px">
                <div style="height:100%;width:${stepPct}%;background:var(--oc-green);border-radius:3px"></div>
              </div>
              <div class="oc-copy" style="font-size:11px">${ev.text}</div>
            </div>
          </div>
        </div>
      </div>`;
    } else if (ev.type === 'reset') {
      html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
        <div class="oc-event" data-tone="bad" style="padding:8px 12px;animation:oc-alarm-strobe 0.4s ease-out 2">
          <div style="display:flex;align-items:center;gap:8px;width:100%">
            ${portrait(ev.player, 28)}
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <span style="font:700 11px/1 'Share Tech Mono',monospace;color:#fff">${ev.player}</span>
                <span style="font:700 9px/1 'Share Tech Mono',monospace;color:var(--oc-red);letter-spacing:1px">🚨 STEP ${ev.wasAt} → 0</span>
              </div>
              <div style="height:5px;background:rgba(255,45,45,0.15);border-radius:3px;overflow:hidden;margin-bottom:4px">
                <div style="height:100%;width:0%;background:var(--oc-red);border-radius:3px"></div>
              </div>
              <div class="oc-copy" style="font-size:11px">${ev.text}</div>
            </div>
          </div>
        </div>
      </div>`;
    } else if (ev.type === 'bag') {
      html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
        <div class="oc-event" data-tone="good" style="padding:12px;border:2px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.06)">
          <div style="display:flex;align-items:center;gap:10px;width:100%">
            ${portrait(ev.player, 36)}
            <div style="flex:1">
              <div style="font:700 9px/1 'Share Tech Mono',monospace;color:var(--oc-green);letter-spacing:2px;margin-bottom:4px">💼 BAG SECURED</div>
              <div style="font:700 14px/1 'Share Tech Mono',monospace;color:#fff">${ev.player}</div>
              <div class="oc-copy" style="margin-top:4px">${ev.text}</div>
              <div style="font:700 9px/1 'Share Tech Mono',monospace;color:var(--oc-amber);margin-top:6px;letter-spacing:1px">WIRE CUTTERS + GRAPPLING HOOK — CHOOSE WISELY</div>
            </div>
          </div>
        </div>
      </div>`;
    } else if (ev.type === 'countdown-fake' || ev.type === 'countdown-real') {
      const isFake = ev.type === 'countdown-fake';
      html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
        <div class="oc-event" data-tone="bad" style="padding:14px;text-align:center">
          <div style="width:100%">
            <div class="oc-bomb-timer" style="font-size:${isFake ? '20px' : '16px'};margin-bottom:8px">${isFake ? '💣 10... 9... 8... 7...' : '💣 ...THIS ONE IS REAL.'}</div>
            <div class="oc-copy" style="text-align:left">${ev.text}</div>
          </div>
        </div>
      </div>`;
    } else if (ev.type === 'choice-selfish' || ev.type === 'choice-selfless') {
      const isSelfish = ev.type === 'choice-selfish';
      html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
        <div class="oc-event" data-tone="${isSelfish ? 'bad' : 'good'}" style="padding:14px;border:2px solid ${isSelfish ? 'rgba(255,45,45,0.3)' : 'rgba(34,197,94,0.3)'};background:${isSelfish ? 'rgba(255,45,45,0.04)' : 'rgba(34,197,94,0.04)'}">
          <div style="display:flex;align-items:center;gap:10px;width:100%">
            ${portrait(ev.player, 40)}
            <div style="flex:1">
              <div style="font:700 10px/1 'Share Tech Mono',monospace;letter-spacing:2px;color:${isSelfish ? 'var(--oc-red)' : 'var(--oc-green)'};margin-bottom:6px">${isSelfish ? '🔧 KEPT THE WIRE CUTTERS' : '🪝 USED THE GRAPPLING HOOK'}</div>
              <div class="oc-copy">${ev.text}</div>
            </div>
          </div>
        </div>
      </div>`;
    } else if (ev.type === 'countdown-reveal') {
      html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
        <div class="oc-event oc-drama" data-tone="warn" style="padding:12px;text-align:center">
          <div style="width:100%">
            <div style="font:700 11px/1 'Share Tech Mono',monospace;color:var(--oc-amber);letter-spacing:2px;margin-bottom:6px">🎭 COUNTDOWN WAS FAKE</div>
            <div class="oc-copy">${ev.text}</div>
          </div>
        </div>
      </div>`;
    } else {
      // Mid-vault events + reactions
      const portraits = ppl.map(p => portrait(p, 28)).join('');
      const isDrama = ev.type === 'reaction' || ev.type === 'stuck' || ev.type === 'showmance' || ev.type === 'help';
      const tone = ['stuck', 'reset'].includes(ev.type) ? 'bad' : ['showmance', 'help', 'advance'].includes(ev.type) ? 'good' : 'warn';
      html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
        <div class="oc-event ${isDrama ? 'oc-drama' : ''}" data-tone="${tone}" style="padding:10px">
          <div style="display:flex;gap:4px">${portraits}</div>
          <div class="oc-copy" ${ev.type === 'reaction' ? 'style="font-style:italic"' : ''}>${ev.text}</div>
        </div>
      </div>`;
    }
  });

  const done = state.idx >= events.length - 1;
  html += `<div id="oc-controls-${stateKey}" class="oc-controls" ${done ? 'style="display:none"' : ''}>
    <button class="oc-btn" onclick="operationClassifiedRevealNext('${stateKey}',${events.length},'laser')">Breach</button>
    <button class="oc-btn secondary" onclick="operationClassifiedRevealAll('${stateKey}',${events.length},'laser')">Reveal All</button>
  </div>`;
  return shell(ep, html, 'laser', events);
}

function _renderWiretapScreen(ep, timelineKey, stateKeySuffix, btnLabel) {
  const events = ep.operationClassified.timeline[timelineKey] || [];
  const stateKey = `oc-${ep.num}-${stateKeySuffix}`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const state = window._tvState[stateKey];

  let html = '';
  events.forEach((ev, i) => {
    const visible = i <= state.idx;
    const ppl = (ev.players || [ev.player]).filter(Boolean);
    const isDrama = ev.badgeText && !['intel', 'alliance', 'alliance-fail', 'blackmail', 'blackmail-foiled'].includes(ev.type);
    const typeLabel = ev.type === 'intel' ? 'INTEL INTERCEPTED' : ev.type === 'alliance' ? 'BOND FORMED' : ev.type === 'alliance-fail' ? 'PITCH REJECTED' : ev.type === 'blackmail' ? 'BLACKMAIL DETECTED' : ev.type === 'blackmail-foiled' ? 'BLACKMAIL FOILED' : isDrama ? (ev.badgeText || 'INTERCEPT') : 'TRANSMISSION';
    const freq = `${(137.2 + i * 0.8).toFixed(1)} MHz`;
    html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
      <div class="oc-wire-card">
        <div class="oc-wire-header">
          <div class="oc-wire-signal"></div>
          <div class="oc-wire-label">${isDrama ? 'SURVEILLANCE LOG' : 'INTERCEPTED TRANSMISSION'} — ${freq}</div>
        </div>
        <div class="oc-wire-body">
          <div class="oc-wire-portraits">${ppl.map(p => portrait(p, 36)).join('')}</div>
          <div>
            <div class="oc-wire-text">${ev.text}</div>
            <div class="oc-wire-type ${ev.type}">${typeLabel}</div>
          </div>
        </div>
      </div>
    </div>`;
  });

  const done = state.idx >= events.length - 1;
  html += `<div id="oc-controls-${stateKey}" class="oc-controls" ${done ? 'style="display:none"' : ''}>
    <button class="oc-btn" onclick="operationClassifiedRevealNext('${stateKey}',${events.length},'${stateKeySuffix}')">${btnLabel}</button>
    <button class="oc-btn secondary" onclick="operationClassifiedRevealAll('${stateKey}',${events.length},'${stateKeySuffix}')">Reveal All</button>
  </div>`;
  return shell(ep, html, stateKeySuffix, events);
}

export function rpBuildOperationClassifiedWiretap1(ep) {
  return _renderWiretapScreen(ep, 'wiretap1', 'wiretap1', 'Intercept');
}
export function rpBuildOperationClassifiedWiretap2(ep) {
  return _renderWiretapScreen(ep, 'wiretap2', 'wiretap2', 'Intercept');
}
export function rpBuildOperationClassifiedDefusal(ep) {
  const events = ep.operationClassified.timeline.defusal || [];
  const stateKey = `oc-${ep.num}-defusal`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const state = window._tvState[stateKey];

  let html = '';
  events.forEach((ev, i) => {
    const visible = i <= state.idx;

    if (ev.type === 'reaction') {
      const ppl = (ev.players || [ev.player]).filter(Boolean);
      html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
        <div class="oc-event oc-drama" data-tone="warn" style="padding:10px 14px;max-width:500px;margin:4px auto">
          <div style="display:flex;gap:4px">${ppl.map(p => portrait(p, 28)).join('')}</div>
          <div class="oc-copy" style="font-style:italic">${ev.text}</div>
        </div>
      </div>`;
      return;
    }

    // Bomb defusal card
    const isBlast = ev.type === 'blast';
    const isMessy = ev.type === 'messy';
    const isGood = ev.type === 'perfect' || ev.type === 'defused';
    const resultLabel = ev.type === 'perfect' ? '✅ PERFECT DEFUSAL' : ev.type === 'defused' ? '✅ DEFUSED' : ev.type === 'messy' ? '⚠️ MESSY — FOAM EVERYWHERE' : '💥 DETONATED';
    const methodLabel = ev.pickMethod === 'copy' ? 'COPIED' : ev.pickMethod === 'fashion' ? 'FASHION PICK' : ev.pickMethod === 'analyze' ? 'CIRCUIT ANALYSIS' : ev.pickMethod === 'panic' ? 'PANIC CUT' : 'GUT FEELING';
    const slug = players.find(p => p.name === ev.player)?.slug || ev.player.toLowerCase().replace(/\s+/g, '-');

    // Build wire panel — show all 6 wires, highlight the chosen one
    let wiresHtml = '';
    for (const w of WIRE_COLORS) {
      const isChosen = w === ev.wire;
      const isCut = isChosen;
      wiresHtml += `<div class="oc-wire ${isCut ? 'cut chosen' : ''}" style="background:${WIRE_CSS[w]};color:${WIRE_CSS[w]}"></div>`;
    }

    html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">
      <div class="oc-bomb-card ${isBlast ? 'blast-card' : isMessy ? 'messy-card' : ''}" style="${isBlast ? 'border-color:rgba(255,45,45,0.4)' : isGood ? 'border-color:rgba(34,197,94,0.2)' : ''}">
        ${isBlast ? '<div class="oc-bomb-boom"></div><div class="oc-bomb-stink"></div>' : isMessy ? '<div class="oc-bomb-foam"></div>' : ''}
        <div class="oc-bomb-header">
          <div style="display:flex;align-items:center;gap:8px">
            ${portrait(ev.player, 28)}
            <div>
              <div style="font:700 12px/1 'Share Tech Mono',monospace;color:#fff">${ev.player}</div>
              <div style="font:9px/1 'Share Tech Mono',monospace;color:rgba(255,255,255,0.3);letter-spacing:1px;margin-top:2px">${methodLabel}</div>
            </div>
          </div>
          <div class="oc-bomb-timer-display" style="${isGood ? 'animation:none;color:var(--oc-green)' : isBlast ? 'color:var(--oc-red)' : ''}">${isGood ? '00:01' : isBlast ? 'BOOM' : '00:03'}</div>
        </div>
        <div class="oc-bomb-wires">${wiresHtml}</div>
        <div class="oc-bomb-body">
          <div style="flex:1">
            <div class="oc-copy" style="font-size:11px;margin-bottom:4px;color:rgba(255,255,255,0.5)">${ev.pickText}</div>
            <div class="oc-copy" style="font-size:12px">${ev.resultText}</div>
            <div class="oc-bomb-result ${ev.type}">${resultLabel}</div>
            ${ev.wireCorrect === false && !isBlast ? `<div style="font:9px/1 'Share Tech Mono',monospace;color:rgba(255,255,255,0.2);margin-top:4px">Correct wire was ${ev.correctWire}</div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  });

  const done = state.idx >= events.length - 1;
  html += `<div id="oc-controls-${stateKey}" class="oc-controls" ${done ? 'style="display:none"' : ''}>
    <button class="oc-btn" onclick="operationClassifiedRevealNext('${stateKey}',${events.length},'defusal')">Cut Wire</button>
    <button class="oc-btn secondary" onclick="operationClassifiedRevealAll('${stateKey}',${events.length},'defusal')">Reveal All</button>
  </div>`;
  return shell(ep, html, 'defusal', events);
}

export function rpBuildOperationClassifiedDebrief(ep) {
  const oc = ep.operationClassified;
  const winner = oc.final?.winner || ep.immunityWinner;
  const ranked = oc.leaderboard || [];
  const stateKey = `oc-${ep.num}-debrief`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Step 1: Fallout summary
  const fallout = [
    oc.blackmail?.foiled ? `Blackmail foiled: ${oc.blackmail.blackmailer} got exposed by ${oc.blackmail.exposer}.` : oc.blackmail ? `Blackmail unresolved: ${oc.blackmail.blackmailer} holds leverage on ${oc.blackmail.target}.` : '',
    oc.alliancePitch?.accepted ? `New bond formed: ${[oc.alliancePitch.pitcher, ...oc.alliancePitch.targets].join(', ')} built trust during the mission.` : '',
    oc.laserChoice?.choseSelfish ? `${oc.laserChoice.player} kept the wire cutters over saving the group.` : oc.laserChoice ? `${oc.laserChoice.player} saved the group with the grappling hook.` : '',
    oc.final?.extraImmune ? `${oc.final.extraImmune} also receives immunity — double immunity.` : oc.final?.tiebreak ? `Tie broken by sudden defusal: ${oc.final.tiebreak.winner} wins.` : '',
  ].filter(Boolean);
  if (fallout.length) {
    steps.push({ text: `<div style="margin-bottom:12px">${fallout.map(t => `<div class="oc-event oc-drama" data-tone="warn"><div class="oc-copy">${t}</div></div>`).join('')}</div>` });
  }

  // Step 2: Agent dossier folders — one grid showing all players
  const bottomTwo = ranked.slice(-2).map(r => r.name);
  let foldersHtml = `<div style="text-align:center;margin-bottom:12px">
    <div style="font:700 10px/1 'Share Tech Mono',monospace;letter-spacing:3px;color:var(--oc-amber);margin-bottom:10px">MISSION DOSSIERS</div>
  </div>
  <div class="oc-grid">`;
  for (const r of ranked) {
    const isWinner = r.name === winner;
    const isBottom = bottomTwo.includes(r.name);
    const stamp = isWinner ? 'MISSION SUCCESS' : isBottom ? 'MISSION FAILED' : 'MISSION COMPLETE';
    const stampClass = isWinner ? 'mission-success' : isBottom ? 'mission-failed' : 'mission-complete';
    const slug = players.find(p => p.name === r.name)?.slug || r.name.toLowerCase().replace(/\s+/g, '-');
    const defusalResult = oc.players[r.name]?.defusal?.result || '?';
    const laserMax = oc.players[r.name]?.laser?.maxStep || 0;
    foldersHtml += `<div class="oc-folder">
      <div class="oc-folder-content">
        <div class="oc-folder-photo"><img src="assets/avatars/${slug}.png" onerror="this.style.display='none'" alt="${r.name}"></div>
        <div class="oc-folder-name">${r.name}</div>
        <div style="font:9px/1.3 'Share Tech Mono',monospace;color:#555;margin-bottom:4px">
          SCORE: ${Math.round(r.score)} · LASER: ${laserMax}/5 · BOMB: ${defusalResult.toUpperCase()}
        </div>
        <div class="oc-folder-stamp ${stampClass}">${stamp}</div>
      </div>
    </div>`;
  }
  foldersHtml += `</div>`;
  steps.push({ text: foldersHtml });

  // Step 3: Winner reveal
  const winSlug = players.find(p => p.name === winner)?.slug || winner.toLowerCase().replace(/\s+/g, '-');
  steps.push({ text: `<div class="oc-winner">
    <div class="oc-folder" style="margin:0 auto;max-width:160px">
      <div class="oc-folder-content">
        <div class="oc-folder-photo" style="width:72px;height:72px"><img src="assets/avatars/${winSlug}.png" onerror="this.style.display='none'" alt="${winner}"></div>
        <div class="oc-folder-name" style="font-size:14px">${winner}</div>
        <div class="oc-folder-stamp mission-success" style="font-size:11px;padding:5px 10px">IMMUNITY GRANTED</div>
      </div>
    </div>
  </div>` });

  let html = '';
  steps.forEach((step, i) => {
    const visible = i <= revIdx;
    html += `<div id="oc-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">${step.text}</div>`;
  });
  const done = revIdx >= steps.length - 1;
  html += `<div id="oc-controls-${stateKey}" class="oc-controls" ${done ? 'style="display:none"' : ''}>
    <button class="oc-btn" onclick="operationClassifiedRevealNext('${stateKey}',${steps.length},'debrief')">Declassify</button>
    <button class="oc-btn secondary" onclick="operationClassifiedRevealAll('${stateKey}',${steps.length},'debrief')">Reveal All</button>
  </div>`;

  return shell(ep, html, 'debrief', []);
}

// ══════════════════════════════════════════════════════════════
// REVEAL FUNCTIONS
// ══════════════════════════════════════════════════════════════
export function operationClassifiedRevealNext(stateKey, totalSteps, screenKey) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const st = window._tvState[stateKey];
  if (st.idx >= totalSteps - 1) return;
  st.idx++;
  const el = document.getElementById(`oc-step-${stateKey}-${st.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  if (st.idx >= totalSteps - 1) {
    const controls = document.getElementById(`oc-controls-${stateKey}`);
    if (controls) controls.style.display = 'none';
  }
  _operationClassifiedUpdateSidebar(stateKey, screenKey);
}
export function operationClassifiedRevealAll(stateKey, totalSteps, screenKey) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  for (let i = window._tvState[stateKey].idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`oc-step-${stateKey}-${i}`);
    if (el) el.style.display = '';
  }
  window._tvState[stateKey].idx = totalSteps - 1;
  const controls = document.getElementById(`oc-controls-${stateKey}`);
  if (controls) controls.style.display = 'none';
  _operationClassifiedUpdateSidebar(stateKey, screenKey);
}
function _operationClassifiedUpdateSidebar(stateKey, screenKey) {
  const epNum = Number((stateKey.match(/^oc-(\d+)-/) || [])[1] || 0);
  const ep = (gs.episodeHistory || []).find(e => e.num === epNum) || gs.episodeHistory?.[gs.episodeHistory.length - 1];
  const oc = ep?.operationClassified;
  const side = document.getElementById(`oc-sidebar-${stateKey}`);
  if (!oc || !side) return;
  const events = oc.timeline?.[screenKey] || [];
  const idx = window._tvState?.[stateKey]?.idx ?? -1;
  side.innerHTML = buildSidebar(oc, screenKey, idx, events);
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textOperationClassified(ep, ln, sec) {
  if (!ep.operationClassified) return;
  const oc = ep.operationClassified;
  sec('OPERATION CLASSIFIED');
  ln(`${host()} locks the merged players into a spy mission: face scans, laser grids, wiretaps, and bomb defusal.`);
  for (const e of oc.timeline.scan) ln(`  SCAN: ${e.text}`);
  for (const e of oc.timeline.laser) ln(`  LASER: ${e.text}`);
  for (const e of (oc.timeline.wiretap1 || [])) ln(`  WIRETAP: ${e.text}`);
  for (const e of (oc.timeline.wiretap2 || [])) ln(`  WIRETAP: ${e.text}`);
  for (const e of oc.timeline.defusal) ln(`  DEFUSAL: ${e.text}`);
  if (oc.final?.tiebreak) ln(`Tiebreaker: ${oc.final.tiebreak.winner} wins sudden defusal.`);
  if (oc.final?.extraImmune) ln(`${oc.final.extraImmune} also receives immunity (double immunity).`);
  ln(`IMMUNITY: ${oc.final?.winner || ep.immunityWinner}`);
  ln(`ORDER: ${(oc.leaderboard || []).map(r => `${r.name} (${Math.round(r.score)})`).join(', ')}`);
}

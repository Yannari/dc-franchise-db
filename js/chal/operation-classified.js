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
  if (score > 0.40) return 'perfect';
  if (score > 0.28) return 'defused';
  if (score > 0.18) return 'messy';
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
    (pitcher, targets) => `WIRETAP: ${pitcher} uses the camera blackout to pitch ${targets.join(' and ')}. The room has been cold, but the offer lands. A quiet bloc forms.`,
    (pitcher, targets) => `${pitcher} corners ${targets.join(' and ')} during the static. "We vote together from here." Nods all around.`,
  ],
  allianceFailed: [
    (pitcher, targets) => `WIRETAP: ${pitcher} tries to turn being shunned into leverage. ${targets.join(' and ')} listen but don't commit. Not yet.`,
    (pitcher, targets) => `${pitcher}'s pitch falls flat. ${targets[0]} looks at ${targets[1] || 'the floor'}. "We'll think about it." Cold.`,
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
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
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
  }
}

function _simulateLaser(active, state, timeline) {
  const ordered = [...active].sort(() => Math.random() - 0.5);
  for (const name of ordered) {
    const s = pStats(name);
    const pr = pronouns(name);
    const scanMod = state.players[name].scan.result === 'flagged' ? -0.06 : state.players[name].scan.result === 'clear' ? 0.03 : 0;
    const score = s.physical * 0.03 + s.mental * 0.02 + s.endurance * 0.02 + s.intuition * 0.02 + scanMod + noise(0.35);
    const result = laserResult(score);
    let delta = result === 'ghost' ? 3 : result === 'clean' ? 1 : result === 'alarm' ? -1 : -2;
    state.players[name].laser = { score, result };
    state.players[name].total += delta;
    if (result === 'alarm') state.alarm += 10;
    if (result === 'hit') state.alarm += 16;
    timeline.laser.push({
      type: result, player: name, score,
      text: pick(LASER_TEXT[result])(name, pr),
    });
  }
}

function _simulateWiretap(active, state, timeline, ep) {
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

  // Top 2 get intel event
  intelScores.slice(0, 2).forEach(({ name }) => {
    const pr = pronouns(name);
    timeline.wiretap.push({
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
      ep.campEvents[campKey].post.push({ text: pick(WIRETAP_TEXT.allianceAccepted)(pitcher, pool), players: [pitcher, ...pool], badgeText: 'SPY ALLIANCE', badgeClass: 'green', tag: 'drama' });
    } else {
      pool.forEach(p => addBond(pitcher, p, -0.2));
      ep.campEvents[campKey].post.push({ text: pick(WIRETAP_TEXT.allianceFailed)(pitcher, pool), players: [pitcher, ...pool], badgeText: 'FAILED PITCH', badgeClass: 'red', tag: 'drama' });
    }
    timeline.wiretap.push({
      type: accepted ? 'alliance' : 'alliance-fail', player: pitcher, players: [pitcher, ...pool],
      text: accepted ? pick(WIRETAP_TEXT.allianceAccepted)(pitcher, pool) : pick(WIRETAP_TEXT.allianceFailed)(pitcher, pool),
    });
  }

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
    timeline.wiretap.push({
      type: foiled ? 'blackmail-foiled' : 'blackmail', player: blackmailer, players: [blackmailer, target, exposer].filter(Boolean),
      text: foiled ? pick(WIRETAP_TEXT.blackmailFoiled)(blackmailer, target, exposer) : pick(WIRETAP_TEXT.blackmailSuccess)(blackmailer, target),
    });
  }
}

function _simulateDrama(active, state, timeline, ep) {
  const campKey = gs.mergeName || 'merge';
  const dramaEvents = [];
  const eligible = DRAMA_EVENTS.filter(ev => ev.check(active));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const target = 3 + Math.floor(Math.random() * 2); // 3-4
  for (const ev of shuffled) {
    if (dramaEvents.length >= target) break;
    const applied = ev.apply(active, ep);
    if (applied) {
      ep.campEvents[campKey].post.push({ ...applied, tag: 'drama' });
      dramaEvents.push({ id: ev.id, ...applied });
    }
  }
  state.dramaEvents = dramaEvents;
}

function _simulateDefusal(active, state, timeline, ep) {
  const wireNames = ['blue', 'red', 'green', 'yellow', 'black', 'white'];
  for (const name of active) {
    const s = pStats(name);
    const pr = pronouns(name);
    const compromised = state.players[name].laser?.result === 'hit' || state.players[name].scan?.result === 'flagged';
    const intelBonus = (state.players[name].intel?.score || 0) > 0.30 ? 0.04 : 0;
    const score = s.mental * 0.04 + s.intuition * 0.03 + s.temperament * 0.02 + intelBonus + (compromised ? -0.06 : 0) + noise(0.35);
    const result = defusalResult(score);
    const wire = wireNames[Math.floor(Math.abs(Math.round(score * 100 + name.length)) % wireNames.length)];
    let delta = result === 'perfect' ? 4 : result === 'defused' ? 2 : result === 'messy' ? -1 : -3;
    state.players[name].defusal = { score, result, wire };
    state.players[name].total += delta;
    if (result === 'messy') state.alarm += 8;
    if (result === 'blast') state.alarm += 18;
    if (!ep.chalMemberScores) ep.chalMemberScores = {};
    ep.chalMemberScores[name] = Math.round(state.players[name].total);
    timeline.defusal.push({
      type: result, player: name, score,
      text: pick(DEFUSAL_TEXT[result])(name, pr, wire),
    });
  }

  // Rank and determine winner
  const ranked = active.map(name => ({ name, score: state.players[name].total })).sort((a, b) => b.score - a.score);
  let winner = ranked[0]?.name || active[0];
  const runnerUp = ranked[1]?.name || null;
  const tieDiff = runnerUp ? Math.abs(ranked[0].score - ranked[1].score) : Infinity;
  let extraImmune = null;
  let tiebreak = null;
  if (runnerUp && tieDiff <= 1) {
    if (tieDiff <= 0.5) {
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
    players: {}, alarm: 0, alliancePitch: null, blackmail: null, final: null, dramaEvents: [],
  };
  const timeline = { scan: [], laser: [], wiretap: [], defusal: [] };
  active.forEach(name => { state.players[name] = { total: 0 }; });

  _simulateScan(active, state, timeline);
  _simulateLaser(active, state, timeline);
  _simulateWiretap(active, state, timeline, ep);
  _simulateDrama(active, state, timeline, ep);
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

  .oc-winner{text-align:center;padding:28px 14px;position:relative;z-index:5}
  .oc-winner .name{font-family:'Bungee Shade',sans-serif;font-size:28px;letter-spacing:3px;color:#fff;text-shadow:0 0 20px rgba(255,45,45,.2)}
  .oc-stamp{display:inline-block;margin-top:10px;border:2px solid var(--oc-green);color:var(--oc-green);padding:6px 12px;
    font:900 12px 'Share Tech Mono',monospace;letter-spacing:2px;transform:rotate(-2deg)}

  /* Drama break */
  .oc-drama{border-left:3px dashed rgba(245,158,11,.2);background:rgba(245,158,11,.02);font-style:italic}

  @media(prefers-reduced-motion:reduce){
    .oc-shell::after,.oc-bomb-timer,.oc-scan-photo::after,
    .oc-scan-field .val,.oc-scan-status.flagged{animation:none!important}
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
      <div class="oc-event ${ev.type === 'confessional' || ev.badgeText ? 'oc-drama' : ''}" data-tone="${eventTone(ev.type)}">
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
  revealed.forEach(ev => { if (ev.player) statusBy[ev.player] = ev.type; });
  const alarmPct = events.length ? Math.min(99, Math.round((oc.alarm || 0) * Math.max(0, (revIdx + 1) / Math.max(1, events.length)))) : 0;
  const leaderRevealed = screenKey === 'debrief' || (revIdx >= 0 && screenKey === 'defusal');

  let html = `<div class="oc-side-title">Mission Control</div>
    <div class="oc-metric"><span>Alarm Level</span><b style="color:${alarmPct > 60 ? 'var(--oc-red)' : alarmPct > 30 ? 'var(--oc-amber)' : 'var(--oc-green)'}">${alarmPct}%</b></div>
    <div class="oc-metric"><span>Agents Active</span><b>${oc.activePlayers?.length || 0}</b></div>
    ${leaderRevealed ? `<div class="oc-metric"><span>Immunity Lead</span><b style="color:var(--oc-green)">${oc.final?.winner || '???'}</b></div>` : ''}
    <div class="oc-side-title">Agent Status</div>`;
  (oc.activePlayers || []).forEach(name => {
    const st = statusBy[name] || 'pending';
    html += `<div class="oc-agent">${portrait(name, 22)}<span class="name">${name}</span><span class="oc-chip ${st}">${st.toUpperCase()}</span></div>`;
  });
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
  return shell(ep, renderSteps(ep, 'laser', events, 'Breach'), 'laser', events);
}
export function rpBuildOperationClassifiedWiretap(ep) {
  const events = ep.operationClassified.timeline.wiretap || [];
  return shell(ep, renderSteps(ep, 'wiretap', events, 'Intercept'), 'wiretap', events);
}
export function rpBuildOperationClassifiedDrama(ep) {
  const oc = ep.operationClassified;
  if (!oc.dramaEvents?.length) return '';
  const events = oc.dramaEvents.map(e => ({ ...e, type: e.badgeClass || 'warn' }));
  return shell(ep, renderSteps(ep, 'drama', events, 'Next'), 'drama', events);
}
export function rpBuildOperationClassifiedDefusal(ep) {
  const events = ep.operationClassified.timeline.defusal || [];
  return shell(ep, renderSteps(ep, 'defusal', events, 'Cut Wire'), 'defusal', events);
}

export function rpBuildOperationClassifiedDebrief(ep) {
  const oc = ep.operationClassified;
  const winner = oc.final?.winner || ep.immunityWinner;
  const stateKey = `oc-${ep.num}-debrief`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Step 1: Fallout summary
  const fallout = [
    oc.blackmail?.foiled ? `Blackmail foiled: ${oc.blackmail.blackmailer} got exposed by ${oc.blackmail.exposer}.` : oc.blackmail ? `Blackmail unresolved: ${oc.blackmail.blackmailer} holds leverage on ${oc.blackmail.target}.` : 'No blackmail survived the mission.',
    oc.alliancePitch?.accepted ? `New bloc: ${[oc.alliancePitch.pitcher, ...oc.alliancePitch.targets].join(', ')}.` : oc.alliancePitch ? `${oc.alliancePitch.pitcher}'s alliance pitch was rejected.` : '',
    oc.final?.extraImmune ? `${oc.final.extraImmune} also receives immunity — double immunity activated.` : oc.final?.tiebreak ? `Tie broken by sudden defusal: ${oc.final.tiebreak.winner} wins.` : '',
  ].filter(Boolean);
  steps.push({ type: 'warn', text: fallout.map(t => `<div class="oc-event oc-drama" data-tone="warn"><div class="oc-copy">${t}</div></div>`).join('') });

  // Step 2: Leaderboard
  const rows = (oc.leaderboard || []).map((r, i) => {
    const win = r.name === winner;
    return `<div class="oc-agent" style="${win ? 'background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.12);border-radius:4px;padding:4px 6px' : ''}">
      <b style="width:20px;color:${win ? 'var(--oc-green)' : 'var(--oc-steel)'};font-family:monospace;font-size:11px">${i + 1}</b>
      ${portrait(r.name, 26)}<span class="name">${r.name}</span>
      <span class="oc-score">${Math.round(r.score)}</span>
    </div>`;
  }).join('');
  steps.push({ type: 'good', text: `<div class="oc-side-title" style="margin-top:8px">Final Leaderboard</div>${rows}` });

  // Step 3: Winner reveal
  steps.push({ type: 'good', text: `<div class="oc-winner">${portrait(winner, 72)}<div class="name">${winner}</div><div class="oc-stamp">IMMUNITY GRANTED</div></div>` });

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
  for (const e of oc.timeline.wiretap) ln(`  WIRETAP: ${e.text}`);
  if (oc.dramaEvents?.length) {
    ln('  ── DRAMA BREAK ──');
    for (const e of oc.dramaEvents) ln(`  ${e.badgeText}: ${e.text}`);
  }
  for (const e of oc.timeline.defusal) ln(`  DEFUSAL: ${e.text}`);
  if (oc.final?.tiebreak) ln(`Tiebreaker: ${oc.final.tiebreak.winner} wins sudden defusal.`);
  if (oc.final?.extraImmune) ln(`${oc.final.extraImmune} also receives immunity (double immunity).`);
  ln(`IMMUNITY: ${oc.final?.winner || ep.immunityWinner}`);
  ln(`ORDER: ${(oc.leaderboard || []).map(r => `${r.name} (${Math.round(r.score)})`).join(', ')}`);
}
